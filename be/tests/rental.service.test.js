const rentalService = require('../services/rental.service');
const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const HttpError = require('../models/http-error.model');
const mongoose = require('mongoose');
const sendEmail = require('../services/email.service');

jest.mock('../models/rental.model');
jest.mock('../models/costume.model');
jest.mock('../models/user.model');
jest.mock('../models/cart.model');
jest.mock('../services/email.service');

describe('Rental Service', () => {
  let mockCostume;
  let mockUser;
  let mockCart;
  let mockRental;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCostume = {
      _id: new mongoose.Types.ObjectId('60d5ec49c6934c1a48c48a12'),
      name: 'Ao Dai Red',
      pricePerDay: 100000,
      price: 1000000,
      deposit: 500000,
      minRentalDays: 5, // Đặt bằng 5 để các test case thuê 3 ngày ở bên dưới không bị báo lỗi vượt quá giới hạn
      variants: [
        { size: 'L', totalStock: 5, availableStock: 5 }
      ],
      save: jest.fn().mockResolvedValue(true)
    };

    mockUser = {
      _id: 'user_123',
      fullName: 'Customer One',
      phone: '0123456789',
      email: 'customer@gmail.com',
      balance: 1000000,
      save: jest.fn().mockResolvedValue(true)
    };

    mockCart = {
      customerId: 'user_123',
      items: [
        {
          costume: '60d5ec49c6934c1a48c48a12',
          size: 'L',
          startDate: '2026-07-05T00:00:00.000Z',
          endDate: '2026-07-08T00:00:00.000Z',
        }
      ],
      save: jest.fn().mockResolvedValue(true)
    };

    mockRental = {
      _id: 'rental_123',
      customerId: 'user_123',
      items: [
        {
          costume: '60d5ec49c6934c1a48c48a12',
          size: 'L',
          quantity: 1,
          rentalPricePerDay: 33333.33,
          depositPrice: 500000
        }
      ],
      startDate: new Date('2026-07-05'),
      endDate: new Date('2026-07-08'),
      totalRentalPrice: 300000,
      totalDeposit: 500000,
      totalAmount: 850000,
      shippingFee: 50000,
      status: 'pending',
      save: jest.fn().mockResolvedValue(true)
    };
  });

  describe('createOrder', () => {
    test('1. Create order successfully and deduct wallet balance and cleanup cart', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z', // 3 ngày
        items: [
          { costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }
        ],
        shippingFee: 50000,
        shippingAddress: {
          receiverName: 'Customer One',
          receiverPhone: '0123456789',
          addressDetail: '123 Test Street'
        },
        paymentMethod: 'WALLET'
      };

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null); // Không trùng lịch
      User.findById.mockResolvedValue(mockUser);
      Cart.findOne.mockResolvedValue(mockCart);
      Cart.findOneAndDelete.mockResolvedValue(true);

      Rental.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      const result = await rentalService.createOrder('user_123', mockBody);

      expect(mockCostume.variants[0].availableStock).toBe(4);
      expect(mockCostume.save).toHaveBeenCalled();

      expect(mockUser.balance).toBe(120000);
      expect(mockUser.save).toHaveBeenCalled();

      expect(result.customerId).toBe('user_123');
      expect(result.totalRentalPrice).toBe(330000);
      expect(result.totalDeposit).toBe(500000);
      expect(result.totalAmount).toBe(880000);
      expect(result.status).toBe('pending');

      expect(Cart.findOneAndDelete).toHaveBeenCalledWith({ customerId: 'user_123' });
    });

    test('2. costume is not found', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: 'non_existent_id', size: 'L', quantity: 1 }]
      };

      Costume.findById.mockResolvedValue(null);

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Costume not found.', 404));
    });

    test('3. costume is already booked during this timeframe', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }]
      };

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue({ _id: 'existing_rental_id' }); // Trùng lịch

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Sản phẩm đã được đặt trong vài giờ qua. Vui lòng kiểm tra đơn hàng.', 400));
    });

    test('4. requested variant size does not exist', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'M', quantity: 1 }] // Size M
      };

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null);

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Sản phẩm Ao Dai Red không có size M.', 404));
    });

    test('5. quantity requested exceeds available stock', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 10 }] // 10 items (stock is 5)
      };

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null);

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Sản phẩm Ao Dai Red (Size L) không đủ số lượng. Kho chỉ còn 5.', 400));
    });

    test('6. customer user does not exist', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }],
        shippingFee: 50000
      };

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue(null); // Không có user

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Người dùng không tồn tại', 404));
    });

    test('7. customer wallet balance is insufficient', async () => {
      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-08T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }],
        shippingFee: 50000
      };

      mockUser.balance = 50000; // chỉ có 50k (cần 850k)

      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue(mockUser);

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Số dư ví không đủ. Vui lòng nạp thêm tiền.', 400));
    });

    test('8. Fail when start date is in the past', async () => {
      const mockBody = {
        startDate: '2020-01-01T00:00:00.000Z', // Ngày trong quá khứ
        endDate: '2020-01-04T00:00:00.000Z',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }],
        shippingFee: 50000
      };

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(new HttpError('Ngày bắt đầu thuê không được ở trong quá khứ.', 400));
    });

    test('9. Fail when rental days are more than minRentalDays required', async () => {
      mockCostume.minRentalDays = 3; // Sản phẩm giới hạn thuê không vượt quá 3 ngày
      Costume.findById.mockResolvedValue(mockCostume);
      Rental.findOne.mockResolvedValue(null);

      const mockBody = {
        startDate: '2026-07-05T00:00:00.000Z',
        endDate: '2026-07-10T00:00:00.000Z', // 5 ngày (> 3 ngày)
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }],
        shippingFee: 50000
      };

      await expect(rentalService.createOrder('user_123', mockBody))
        .rejects
        .toThrow(
          new HttpError('Số ngày thuê không vượt quá  (3 ngày).', 400)
        );
    });
  });

  describe('cancelOrder', () => {
    test('1. Cancel order successfully and refund balance and restock', async () => {
      Rental.findOne.mockResolvedValue(mockRental);
      User.findById.mockResolvedValue(mockUser);
      Costume.findById.mockResolvedValue(mockCostume);

      const result = await rentalService.cancelOrder('rental_123', 'user_123', 'Changed my mind');

      expect(result.status).toBe('cancelled');
      expect(result.paymentStatus).toBe('refunded');
      expect(result.cancelReason).toBe('Changed my mind');

      // Check balance refund (1M + 850k = 1850k)
      expect(mockUser.balance).toBe(1850000);
      expect(mockUser.save).toHaveBeenCalled();

      // Check restocked item (5 + 1 = 6)
      expect(mockCostume.variants[0].availableStock).toBe(6);
      expect(mockCostume.save).toHaveBeenCalled();

      // Check email sent
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'customer@gmail.com',
        subject: 'CostumeHUB — Thông báo hủy đơn hàng'
      }));
    });

    test('2. Fail to cancel when order status is not pending', async () => {
      mockRental.status = 'renting'; // Trạng thái đã nhận đồ, không cho huỷ
      Rental.findOne.mockResolvedValue(mockRental);

      await expect(rentalService.cancelOrder('rental_123', 'user_123'))
        .rejects
        .toThrow(new HttpError('Không thể hủy đơn hàng ở trạng thái này.', 400));
    });

    test('3. Fail to cancel when order status is not awaitingPayment', async () => {
      mockRental.status = 'awaitingPayment';
      Rental.findOne.mockResolvedValue(mockRental);

      await expect(rentalService.cancelOrder('rental_123', 'user_123'))
        .rejects
        .toThrow(new HttpError('Không thể hủy đơn hàng ở trạng thái này.', 400));
    });
  });
});
