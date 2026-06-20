const Cart = require('../models/cart.model');
const Costume = require('../models/costume.model');
const { getAllCarts, addCart, updateCart, removeAllCartByCustomer, removeCartItem } = require('../controllers/cart.controller');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Tạo ngày trong tương lai (n ngày từ hôm nay, giờ 00:00:00) */
const futureDate = (daysFromNow) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString();
};

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockCostume = (overrides = {}) => ({
    _id: 'costume123',
    name: 'Áo dài đỏ',
    pricePerDay: 100000,
    deposit: 200000,
    variants: [{ size: 'M', availableStock: 5 }],
    ...overrides,
});


jest.mock('../models/cart.model');
jest.mock('../models/costume.model');

describe('getAllCarts', () => {
    beforeEach(() => jest.clearAllMocks());

    test('Cart is empty', async () => {
        Cart.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await getAllCarts(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toBe('Cart is empty.');
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('Cart items list', async () => {
        const fakeCarts = [{
            items: [{
                _id: 'item1',
                costume: {
                    _id: 'costume1',
                    name: 'Áo dài',
                    status: 'available',
                    images: ['img.jpg'],
                    categoryId: { name: 'Truyền thống' },
                    deposit: 200000,
                    pricePerDay: 100000,
                    variants: [{ size: 'M' }],
                },
                size: 'M',
                quantity: 1,
                status: 'active',
                startDate: new Date(futureDate(2)),
                endDate: new Date(futureDate(4)),
                rentalDays: 2,
            }],
            save: jest.fn().mockResolvedValue(true),
        }];

        Cart.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(fakeCarts)
        });

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await getAllCarts(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
        const result = res.json.mock.calls[0][0];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].costumeName).toBe('Áo dài');
        expect(next).not.toHaveBeenCalled();
    });

    test('Auto-cleanup: xóa item có costume bị xóa (null)', async () => {
        // costume = null khi DB record bị xóa cứng
        const fakeCart = {
            items: [
                { costume: null, size: 'M' },   // đã bị xóa
                {
                    _id: 'item2',
                    costume: {
                        _id: 'costume2',
                        name: 'Váy hoa',
                        status: 'available',
                        images: [],
                        categoryId: { name: 'Hiện đại' },
                        deposit: 100000,
                        pricePerDay: 50000,
                        variants: [{ size: 'S' }],
                    },
                    size: 'S',
                    quantity: 1,
                    status: 'active',
                    startDate: new Date(futureDate(2)),
                    endDate: new Date(futureDate(4)),
                    rentalDays: 2,
                },
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        Cart.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([fakeCart])
        });

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await getAllCarts(req, res, next);

        // Phải gọi save() để lưu lại giỏ hàng sau khi xóa item null
        expect(fakeCart.save).toHaveBeenCalled();
        // Chỉ trả về item hợp lệ (Váy hoa)
        expect(res.status).toHaveBeenCalledWith(200);
        const result = res.json.mock.calls[0][0];
        expect(result).toHaveLength(1);
        expect(result[0].costumeName).toBe('Váy hoa');
    });

    test('Auto-cleanup: xóa item có costume bị ẩn (hidden)', async () => {
        const fakeCart = {
            items: [
                {
                    _id: 'item1',
                    costume: {
                        _id: 'costume1',
                        name: 'Áo bị ẩn',
                        status: 'hidden',   // inactive
                        images: [],
                        categoryId: { name: 'Cũ' },
                        deposit: 0,
                        pricePerDay: 0,
                        variants: [],
                    },
                    size: 'M', quantity: 1, status: 'active',
                    startDate: new Date(futureDate(2)), endDate: new Date(futureDate(4)), rentalDays: 2,
                },
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        Cart.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([fakeCart])
        });

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await getAllCarts(req, res, next);

        // Sau cleanup giỏ rỗng → trả 404
        expect(fakeCart.save).toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toBe('Cart is empty.');
    });
});


describe('addCart', () => {
    beforeEach(() => jest.clearAllMocks());

    const baseReq = (overrides = {}) => ({
        userData: { id: 'user1' },
        body: {
            costumeId: 'costume123',
            size: 'M',
            quantity: 1,
            startDate: futureDate(2),
            endDate: futureDate(4),
            ...overrides,
        },
    });

    test('Costume not found', async () => {
        Costume.findById = jest.fn().mockResolvedValue(null);

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toBe('Costume not found');
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    //Trả 400 khi thiếu thông tin bắt buộc (size)
    test('Missing required information (size)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ size: '' });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    //Trả 404 khi size không tồn tại trong costume
    test('Size not found', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ size: 'XL' }); // costume chỉ có size M
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toContain('XL');
    });

    //Trả 400 khi quantity vượt quá tồn kho
    test('Quantity out of stock', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ quantity: 10 }); // tồn kho chỉ còn 5
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('tồn kho');
    });

    //Trả 400 khi startDate không hợp lệ
    test('Invalid startDate', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ startDate: 'not-a-date' });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toBe('Ngày tháng không hợp lệ');
    });

    //Trả 400 khi startDate không đủ 1 ngày trước (đặt ngày hôm nay)
    test('Invalid startDate (startDate>= now + 1day', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        // startDate = hôm nay → phải trước ít nhất 1 ngày
        const req = baseReq({ startDate: futureDate(0), endDate: futureDate(2) });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toContain('trước ít nhất 1 ngày');
    });

    //Trả 400 khi endDate trước startDate
    test('Invalid endDate (endDate comes before startDate)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ startDate: futureDate(4), endDate: futureDate(2) });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].message).toContain('Ngày trả đồ');
    });

    //Tạo cart mới khi chưa tồn tại
    test('Create new cart when does not exist', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());
        Cart.findOne = jest.fn().mockResolvedValue(null);

        const mockCart = {
            _id: 'cart1',
            items: [],
            populate: jest.fn().mockResolvedValue(true),
        };
        Cart.create = jest.fn().mockResolvedValue(mockCart);

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(Cart.create).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Add to cart successfully' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    //Cộng dồn quantity khi item đã tồn tại cùng size và ngày
    test('Add quantity to existing item with same size and date', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const start = new Date(futureDate(2));
        const end = new Date(futureDate(4));

        const existingCart = {
            items: [{
                costume: { toString: () => 'costume123' },
                size: 'M',
                startDate: start,
                endDate: end,
                quantity: 2,
            }],
            populate: jest.fn().mockResolvedValue(true),
        };

        Cart.findOne = jest.fn().mockResolvedValue(existingCart);
        Cart.findOneAndUpdate = jest.fn().mockResolvedValue({
            ...existingCart,
            populate: jest.fn().mockResolvedValue(true),
        });

        const req = baseReq({ startDate: start.toISOString(), endDate: end.toISOString(), quantity: 1 });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
            { customerId: 'user1' },
            expect.objectContaining({ $inc: expect.any(Object) }),
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    //Trả 400 khi tổng quantity trong giỏ vượt quá tồn kho khi cộng dồn
    test('Invalid total quantity', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume()); // availableStock = 5

        const start = new Date(futureDate(2));
        const end = new Date(futureDate(4));

        const existingCart = {
            items: [{
                costume: { toString: () => 'costume123' },
                size: 'M',
                startDate: start,
                endDate: end,
                quantity: 4, // + 2 thêm mới = 6 > 5 → lỗi
            }],
        };

        Cart.findOne = jest.fn().mockResolvedValue(existingCart);

        const req = baseReq({ startDate: start.toISOString(), endDate: end.toISOString(), quantity: 2 });
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('tồn kho');
    });

    //Thêm item mới vào cart đã có (khác size/ngày)
    test('Add new item to existing cart (different size/date)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const existingCart = {
            items: [{
                costume: { toString: () => 'costume123' },
                size: 'L', // khác size
                startDate: new Date(futureDate(5)),
                endDate: new Date(futureDate(7)),
                quantity: 1,
            }],
            populate: jest.fn().mockResolvedValue(true),
        };

        Cart.findOne = jest.fn().mockResolvedValue(existingCart);
        Cart.findOneAndUpdate = jest.fn().mockResolvedValue({
            ...existingCart,
            populate: jest.fn().mockResolvedValue(true),
        });

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
            { customerId: 'user1' },
            expect.objectContaining({ $push: expect.any(Object) }),
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});


describe('removeAllCartByCustomer', () => {
    beforeEach(() => jest.clearAllMocks());

    test('Xóa toàn bộ giỏ hàng thành công', async () => {
        Cart.findOneAndDelete = jest.fn().mockResolvedValue(true);

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await removeAllCartByCustomer(req, res, next);

        expect(Cart.findOneAndDelete).toHaveBeenCalledWith({ customerId: 'user1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Đã xóa toàn bộ giỏ hàng thành công' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('Gọi next với lỗi 500 khi DB throw error', async () => {
        Cart.findOneAndDelete = jest.fn().mockRejectedValue(new Error('DB error'));

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await removeAllCartByCustomer(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(500);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  removeCartItem
// ─────────────────────────────────────────────────────────────────────────────

describe('removeCartItem', () => {
    beforeEach(() => jest.clearAllMocks());

    test('Trả 400 khi không có costumeId', async () => {
        const req = { userData: { id: 'user1' }, body: {} };
        const res = mockRes();
        const next = jest.fn();

        await removeCartItem(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('Trả 200 với thông báo rỗng khi cart không tồn tại', async () => {
        Cart.findOne = jest.fn().mockResolvedValue(null);

        const req = { userData: { id: 'user1' }, body: { costumeId: 'costume123' } };
        const res = mockRes();
        const next = jest.fn();

        await removeCartItem(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Giỏ hàng đã rỗng' }));
    });

    test('Xóa đúng item khi truyền đủ costumeId + size + startDate + endDate', async () => {
        const start = futureDate(2);
        const end = futureDate(4);

        const fakeCart = {
            items: [
                {
                    costume: { toString: () => 'costume123' },
                    size: 'M',
                    startDate: new Date(start),
                    endDate: new Date(end),
                },
                {
                    costume: { toString: () => 'costume456' },
                    size: 'L',
                    startDate: new Date(start),
                    endDate: new Date(end),
                },
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = {
            userData: { id: 'user1' },
            body: { costumeId: 'costume123', size: 'M', startDate: start, endDate: end },
        };
        const res = mockRes();
        const next = jest.fn();

        await removeCartItem(req, res, next);

        expect(fakeCart.items).toHaveLength(1);
        expect(fakeCart.items[0].costume.toString()).toBe('costume456');
        expect(fakeCart.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' })
        );
    });

    test('Xóa tất cả variants của costume khi chỉ truyền costumeId', async () => {
        const fakeCart = {
            items: [
                { costume: { toString: () => 'costume123' }, size: 'M' },
                { costume: { toString: () => 'costume123' }, size: 'L' },
                { costume: { toString: () => 'costume456' }, size: 'M' },
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = {
            userData: { id: 'user1' },
            body: { costumeId: 'costume123' }, // không truyền size/date
        };
        const res = mockRes();
        const next = jest.fn();

        await removeCartItem(req, res, next);

        // Chỉ còn costume456
        expect(fakeCart.items).toHaveLength(1);
        expect(fakeCart.items[0].costume.toString()).toBe('costume456');
        expect(fakeCart.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  updateCart
// ─────────────────────────────────────────────────────────────────────────────

describe('updateCart', () => {
    beforeEach(() => jest.clearAllMocks());

    const baseReq = (overrides = {}) => ({
        userData: { id: 'user1' },
        params: { costumeId: 'costume123' },
        body: {
            size: 'M',
            quantity: 2,
            startDate: futureDate(3),
            endDate: futureDate(6),
            ...overrides,
        },
    });

    test('Trả 404 khi costume không tồn tại', async () => {
        Costume.findById = jest.fn().mockResolvedValue(null);

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toBe('Costume not found');
    });

    test('Trả 400 khi thiếu thông tin bắt buộc', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ size: '' });
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('Trả 404 khi size không tồn tại trong costume', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = baseReq({ size: 'XXL' });
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toContain('XXL');
    });

    test('Trả 404 khi cart không tồn tại', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());
        Cart.findOne = jest.fn().mockResolvedValue(null);

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toBe('Cart not found');
    });

    test('Trả 404 khi item không tồn tại trong giỏ', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const fakeCart = {
            items: [{
                costume: { toString: () => 'costume999' }, // khác costume
                size: 'M',
                startDate: new Date(futureDate(3)),
                endDate: new Date(futureDate(6)),
            }],
            save: jest.fn(),
            populate: jest.fn(),
        };
        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = baseReq();
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toContain('Không tìm thấy');
    });

    test('Cập nhật số lượng thành công (không đổi size/ngày)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const start = new Date(futureDate(3));
        const end = new Date(futureDate(6));

        const fakeItem = {
            costume: { toString: () => 'costume123' },
            size: 'M',
            startDate: start,
            endDate: end,
            quantity: 1,
        };

        const fakeCart = {
            items: [fakeItem],
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = baseReq({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            quantity: 2,
        });
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(fakeItem.quantity).toBe(2);
        expect(fakeCart.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Cập nhật giỏ hàng thành công' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    // ── Line 210: updateCart quantity > availableStock ──────────────────────
    test('updateCart: quantity vượt quá tồn kho (line 210)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume()); // availableStock = 5

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                size: 'M',
                quantity: 10,      // > 5 → lỗi
                startDate: futureDate(3),
                endDate: futureDate(6),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('tồn kho');
    });

    // ── Line 217: updateCart ngày không hợp lệ ─────────────────────────────
    test('updateCart: ngày không hợp lệ (line 217)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                size: 'M',
                quantity: 2,
                startDate: 'invalid-date',
                endDate: futureDate(6),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toBe('Ngày tháng không hợp lệ');
    });

    // ── Line 234: updateCart startDate <= ngày mai ──────────────────────────
    test('updateCart: startDate quá sớm (line 234)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                size: 'M',
                quantity: 2,
                startDate: futureDate(1),   // ngày mai → <= tomorrow → lỗi
                endDate: futureDate(4),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toBe('Ngày nhận đồ phải sau ngày mai');
    });

    // ── Line 238: updateCart endDate < startDate ────────────────────────────
    test('updateCart: endDate trước startDate (line 238)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume());

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                size: 'M',
                quantity: 2,
                startDate: futureDate(5),
                endDate: futureDate(3),     // trước startDate → lỗi
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Ngày trả đồ');
    });

    // ── Lines 272-293: isIdentityChanged=true, item trùng → merge ──────────
    test('updateCart: đổi size → item mới trùng item có sẵn → merge quantity (lines 272-293)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume({ variants: [{ size: 'M', availableStock: 10 }, { size: 'L', availableStock: 10 }] }));

        const start = new Date(futureDate(3));
        const end = new Date(futureDate(6));

        // Giỏ có 2 item: item cũ (size L, ngày đó) + item đích (size M, cùng ngày)
        const oldItem = {
            costume: { toString: () => 'costume123' },
            size: 'L',
            startDate: start,
            endDate: end,
            quantity: 1,
        };
        const targetItem = {
            costume: { toString: () => 'costume123' },
            size: 'M',
            startDate: start,
            endDate: end,
            quantity: 2,
            rentalDays: 0,
            rentalPrice: 0,
            depositPrice: 0,
        };

        const fakeCart = {
            items: [oldItem, targetItem],
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                oldSize: 'L',                        // size cũ
                size: 'M',                           // đổi sang M — trùng targetItem
                quantity: 3,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                oldStartDate: start.toISOString(),
                oldEndDate: end.toISOString(),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        // oldItem (L) phải bị splice ra khỏi giỏ
        expect(fakeCart.items.some(i => i.size === 'L')).toBe(false);
        // targetItem (M) được cộng dồn quantity: 2 + 3 = 5
        expect(targetItem.quantity).toBe(5);
        expect(fakeCart.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    // ── Line 284: isIdentityChanged=true, item trùng nhưng tổng quantity vượt tồn kho ──
    test('updateCart: đổi size → trùng item có sẵn → tổng quantity vượt tồn kho → 400 (line 284)', async () => {
        // availableStock = 5, targetItem.quantity = 4, thêm 3 → 4+3=7 > 5 → lỗi
        Costume.findById = jest.fn().mockResolvedValue(mockCostume({
            variants: [{ size: 'M', availableStock: 5 }, { size: 'L', availableStock: 5 }]
        }));

        const start = new Date(futureDate(3));
        const end = new Date(futureDate(6));

        const oldItem = {
            costume: { toString: () => 'costume123' },
            size: 'L',
            startDate: start,
            endDate: end,
            quantity: 1,
        };
        const targetItem = {
            costume: { toString: () => 'costume123' },
            size: 'M',
            startDate: start,
            endDate: end,
            quantity: 4,    // 4 + 3 (quantity mới) = 7 > 5 → lỗi
            rentalDays: 0,
            rentalPrice: 0,
            depositPrice: 0,
        };

        const fakeCart = {
            items: [oldItem, targetItem],
            save: jest.fn(),
            populate: jest.fn(),
        };
        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                oldSize: 'L',
                size: 'M',                          // đổi sang M → trùng targetItem
                quantity: 3,                        // 4 + 3 = 7 > 5 → phải báo lỗi
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                oldStartDate: start.toISOString(),
                oldEndDate: end.toISOString(),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('tồn kho');
        expect(fakeCart.save).not.toHaveBeenCalled(); // không lưu khi lỗi
    });

    // ── Lines 294-302: isIdentityChanged=true, không trùng → update item ───
    test('updateCart: đổi size → không trùng item nào → cập nhật item (lines 294-302)', async () => {
        Costume.findById = jest.fn().mockResolvedValue(mockCostume({ variants: [{ size: 'M', availableStock: 10 }, { size: 'L', availableStock: 10 }] }));

        const start = new Date(futureDate(3));
        const end = new Date(futureDate(6));
        const newStart = new Date(futureDate(4));
        const newEnd = new Date(futureDate(7));

        const existingItem = {
            costume: { toString: () => 'costume123' },
            size: 'M',
            startDate: start,
            endDate: end,
            quantity: 1,
            rentalDays: 0,
            rentalPrice: 0,
            depositPrice: 0,
        };

        const fakeCart = {
            items: [existingItem],
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        Cart.findOne = jest.fn().mockResolvedValue(fakeCart);

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: {
                size: 'L',                           // đổi sang L
                quantity: 2,
                startDate: newStart.toISOString(),   // ngày mới
                endDate: newEnd.toISOString(),
                oldSize: 'M',
                oldStartDate: start.toISOString(),
                oldEndDate: end.toISOString(),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        // item được cập nhật sang size L, ngày mới
        expect(existingItem.size).toBe('L');
        expect(existingItem.quantity).toBe(2);
        expect(fakeCart.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    // ── Line 319: catch block của updateCart ────────────────────────────────
    test('updateCart: DB throw error → catch 500 (line 319)', async () => {
        Costume.findById = jest.fn().mockRejectedValue(new Error('DB crashed'));

        const req = {
            userData: { id: 'user1' },
            params: { costumeId: 'costume123' },
            body: { size: 'M', quantity: 1, startDate: futureDate(3), endDate: futureDate(6) },
        };
        const res = mockRes();
        const next = jest.fn();

        await updateCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(500);
        expect(next.mock.calls[0][0].message).toBe('DB crashed');
    });
});

// ── Line 58: catch block của getAllCarts ─────────────────────────────────────
describe('getAllCarts - error handling', () => {
    beforeEach(() => jest.clearAllMocks());

    test('getAllCarts: DB throw error → catch 500 (line 58)', async () => {
        Cart.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('DB crashed'))
        });

        const req = { userData: { id: 'user1' } };
        const res = mockRes();
        const next = jest.fn();

        await getAllCarts(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(500);
        expect(next.mock.calls[0][0].message).toBe('DB crashed');
    });
});

// ── Line 179: catch block của addCart ────────────────────────────────────────
describe('addCart - error handling', () => {
    beforeEach(() => jest.clearAllMocks());

    test('addCart: DB throw error → catch 500 (line 179)', async () => {
        Costume.findById = jest.fn().mockRejectedValue(new Error('DB crashed'));

        const req = {
            userData: { id: 'user1' },
            body: {
                costumeId: 'costume123',
                size: 'M',
                quantity: 1,
                startDate: futureDate(2),
                endDate: futureDate(4),
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await addCart(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(500);
        expect(next.mock.calls[0][0].message).toBe('DB crashed');
    });
});

// ── Line 368: catch block của removeCartItem ─────────────────────────────────
describe('removeCartItem - error handling', () => {
    beforeEach(() => jest.clearAllMocks());

    test('removeCartItem: DB throw error → catch 500 (line 368)', async () => {
        Cart.findOne = jest.fn().mockRejectedValue(new Error('DB crashed'));

        const req = {
            userData: { id: 'user1' },
            body: { costumeId: 'costume123' },
        };
        const res = mockRes();
        const next = jest.fn();

        await removeCartItem(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(500);
        expect(next.mock.calls[0][0].message).toBe('DB crashed');
    });
});

