const costumeService = require('../services/costume.service');
const Costume = require('../models/costume.model');
const Category = require('../models/category.model');
const HttpError = require('../models/http-error.model');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../models/costume.model');
jest.mock('../models/category.model');

describe('Costume Service - Unit Tests', () => {
  let mockCostume;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCostume = {
      _id: 'costume_id_123',
      name: 'Ao Dai Viet Nam',
      slug: 'ao-dai-viet-nam',
      sku: 'AD-001',
      categoryId: 'category_id_123',
      description: 'Ao dai truyen thong',
      images: ['image1.png'],
      size: 'L',
      color: 'Red',
      condition: 'New',
      pricePerDay: 150000,
      price: 1500000,
      deposit: 1000000,
      minRentalDays: 2,
      lateFeePerDay: 50000,
      status: 'available',
      specifications: {},
      variants: [
        { size: 'L', color: 'Red', totalStock: 5, availableStock: 2 }
      ],
      createdBy: 'owner_user_id_123',
      save: jest.fn().mockResolvedValue(this),
    };
  });

  describe('getAllCostumes', () => {
    test('1. Get all costumes list', async () => {
      const mockQuery = {
        categoryId: '507f1f77bcf86cd799439011',
        minPrice: '100000',
        maxPrice: '200000',
        status: 'available',
        page: '1',
        limit: '10',
      };

      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));

      Costume.countDocuments.mockResolvedValue(1);
      Category.find.mockResolvedValue([]);

      const result = await costumeService.getAllCostumes(mockQuery);

      expect(result).toHaveProperty('costumes');
      expect(result.costumes).toHaveLength(1);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        limit: 10,
      });

      const expectedFilter = {
        status: { $in: ['available'] },
        pricePerDay: { $gte: 100000, $lte: 200000 },
        $or: [
          { categoryId: { $in: ['507f1f77bcf86cd799439011'] } },
          { 'categoryId.$oid': { $in: ['507f1f77bcf86cd799439011'] } },
          { categoryId: { $in: [expect.any(mongoose.Types.ObjectId)] } }
        ]
      };

      expect(Costume.find).toHaveBeenCalledWith(expectedFilter);
      expect(Costume.countDocuments).toHaveBeenCalledWith(expectedFilter);
    });

    test('2. Filter costume list by categoryId', async () => {
      Category.find.mockResolvedValue([{ _id: 'subcategory_id_456' }]);
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));
      Costume.countDocuments.mockResolvedValue(1);

      await costumeService.getAllCostumes({ categoryId: 'category_id_123' });

      expect(Category.find).toHaveBeenCalled();
      expect(Costume.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.any(Array)
      }));
    });

    test('3. Filter costume list by price range', async () => {
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));
      Costume.countDocuments.mockResolvedValue(1);

      await costumeService.getAllCostumes({ minPrice: '100000', maxPrice: '200000' });

      expect(Costume.find).toHaveBeenCalledWith(expect.objectContaining({
        pricePerDay: { $gte: 100000, $lte: 200000 }
      }));
    });

    test('4. Search costume list by name using regex', async () => {
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));
      Costume.countDocuments.mockResolvedValue(1);

      await costumeService.getAllCostumes({ search: 'Ao Dai' });

      expect(Costume.find).toHaveBeenCalledWith(expect.objectContaining({
        name: { $regex: 'Ao Dai', $options: 'i' }
      }));
    });

    test('5. Sort costume list', async () => {
      const mockSort = jest.fn().mockReturnThis();
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: mockSort,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));
      Costume.countDocuments.mockResolvedValue(1);

      await costumeService.getAllCostumes({ sort: 'price_asc' });

      expect(mockSort).toHaveBeenCalledWith({ pricePerDay: 1 });
    });

    test('6. Pagination of costume list', async () => {
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([mockCostume]);
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: mockSkip,
        limit: mockLimit,
      }));
      Costume.countDocuments.mockResolvedValue(1);

      await costumeService.getAllCostumes({ page: '2', limit: '5' });

      // Page 2, Limit 5 => skip = (2-1)*5 = 5
      expect(mockSkip).toHaveBeenCalledWith(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    test('7. Filter costume list by status', async () => {
      Costume.find.mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockCostume]),
      }));
      Costume.countDocuments.mockResolvedValue(1);

      // Case A: specific status list
      await costumeService.getAllCostumes({ status: 'available,maintenance' });
      expect(Costume.find).toHaveBeenLastCalledWith(expect.objectContaining({
        status: { $in: ['available', 'maintenance'] }
      }));

      // Case B: status = 'all' (should not filter by status or check stock)
      await costumeService.getAllCostumes({ status: 'all' });
      const lastCallArgsAll = Costume.find.mock.calls[Costume.find.mock.calls.length - 1][0];
      expect(lastCallArgsAll.status).toBeUndefined();
      expect(lastCallArgsAll['variants.availableStock']).toBeUndefined();

      // Case C: status is empty / undefined (should default to variants.availableStock > 0)
      await costumeService.getAllCostumes({});
      expect(Costume.find).toHaveBeenLastCalledWith(expect.objectContaining({
        status: { $ne: 'hidden' },
        'variants.availableStock': { $gt: 0 }
      }));
    });
  });

  describe('getCostumeById', () => {
    test('Get costume details', async () => {
      Costume.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockCostume),
      }));

      const result = await costumeService.getCostumeById('costume_id_123');

      expect(result).toEqual(mockCostume);
      expect(Costume.findById).toHaveBeenCalledWith('costume_id_123');
    });

    test('Get costume details if costume is not found', async () => {
      Costume.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      }));

      await expect(costumeService.getCostumeById('non_existent_id'))
        .rejects
        .toThrow(new HttpError('Costume not found.', 404));
    });
  });

  describe('createCostume (Role: Owner)', () => {
    test('Create costume successfully', async () => {
      const mockInputData = {
        name: 'Ao Dai Viet Nam',
        sku: 'AD-001',
        categoryId: 'category_id_123',
        pricePerDay: 150000,
        variants: [
          { size: 'L', color: 'Red', totalStock: 5 }
        ],
      };

      Costume.mockImplementation(() => ({
        ...mockInputData,
        createdBy: 'owner_user_id_123',
        save: jest.fn().mockResolvedValue(true),
      }));

      const result = await costumeService.createCostume(mockInputData, 'owner_user_id_123');

      expect(result.createdBy).toBe('owner_user_id_123');
      expect(result.name).toBe('Ao Dai Viet Nam');
    });

    test('Add new outfits with the required data', async () => {
      const mockMinimalData = {
        name: 'Áo Dài Học Sinh',
        sku: 'ADHS-001',
        categoryId: 'category_id_999',
      };
      Costume.mockImplementation((initData) => ({
        ...initData,
        save: jest.fn().mockResolvedValue(true),
      }));
      const result = await costumeService.createCostume(mockMinimalData, 'owner_user_id_123');
      expect(result.name).toBe('Áo Dài Học Sinh');
      expect(result.sku).toBe('ADHS-001');
      expect(result.images).toEqual([]); // Mặc định là mảng rỗng
      expect(result.pricePerDay).toBe(0); // Mặc định = 0
      expect(result.price).toBe(0); // Mặc định = 0
      expect(result.deposit).toBe(0); // Mặc định = 0
      expect(result.minRentalDays).toBe(1); // Mặc định = 1
      expect(result.lateFeePerDay).toBe(0); // Mặc định = 0
      expect(result.status).toBe('available'); // Mặc định = 'available'
      expect(result.specifications).toEqual({}); // Mặc định là object rỗng
      expect(result.variants).toEqual([]); // Mặc định là mảng rỗng
    })

    test('Check the available inventory levels.', async () => {
      const mockDataWithVariants = {
        name: 'Áo Dài Test Biến Thể',
        sku: 'AD-TEST-002',
        categoryId: 'category_id_123',
        variants: [
          { size: 'S', color: 'Red', totalStock: 10 },
          { size: 'M', color: 'Red', totalStock: 0 },
          { size: 'L', color: 'Red' } // Thiếu totalStock
        ],
      };
      Costume.mockImplementation((initData) => ({
        ...initData,
        save: jest.fn().mockResolvedValue(true),
      }));
      const result = await costumeService.createCostume(mockDataWithVariants, 'owner_user_id_123');
      expect(result.variants[0].availableStock).toBe(10);
      expect(result.variants[1].availableStock).toBe(0);
      expect(result.variants[2].availableStock).toBe(0);
    })


    // khi không có variants -> mặc định size = "free size"

  });

  describe('update costume', () => {
    let mockCostumeInstance;

    beforeEach(() => {
      mockCostumeInstance = {
        _id: 'costume_id_123',
        name: 'Ao Dai Viet Nam',
        status: 'available',
        variants: [
          {
            _id: 'variant_id_1',
            sku: 'AD-01',
            size: 'L',
            color: 'Red',
            totalStock: 5,
            availableStock: 3, // đang thuê: 5 - 3 = 2
            toObject: function () {
              return {
                _id: this._id,
                sku: this.sku,
                size: this.size,
                color: this.color,
                totalStock: this.totalStock,
                availableStock: this.availableStock,
              };
            },
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };
    });

    test('Successfully update costume fields', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);

      const updateData = {
        name: 'Ao Dai Co Dien',
        pricePerDay: 200000,
        variants: [
          { sku: 'AD-01', totalStock: 10 } // Increase stock from 5 to 10
        ]
      };

      const result = await costumeService.updateCostume('costume_id_123', updateData);
      expect(result.name).toBe('Ao Dai Co Dien');
      expect(result.pricePerDay).toBe(200000);
      expect(result.variants[0].totalStock).toBe(10);
      expect(result.variants[0].availableStock).toBe(8); // 3 + (10 - 5)
      expect(mockCostumeInstance.save).toHaveBeenCalled();
    });

    test('Should throw 404 if costume to update is not found', async () => {
      // Setup Mock
      Costume.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(costumeService.updateCostume('non_existent_id', { name: 'New Name' }))
        .rejects
        .toThrow(new HttpError('Costume not found.', 404));
    });

    test('Increase total stock', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 10 } // Tăng từ 5 lên 10
        ]
      });
      expect(result.variants[0].totalStock).toBe(10);
      expect(result.variants[0].availableStock).toBe(8); // 3 + (10 - 5)
    });
    test('Decrease total stock (greater than rented quantity)', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 4 } // Giảm từ 5 xuống 4 (vẫn lớn hơn số lượng thuê là 2)
        ]
      });
      expect(result.variants[0].totalStock).toBe(4);
      expect(result.variants[0].availableStock).toBe(2); // 3 + (4 - 5)
    });
    test('Do not allow reducing total stock below the quantity being rented', async () => {
      mockCostumeInstance.variants[0].availableStock = 1; // 5 - 1 = 4 đang thuê
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 2 } // Muốn giảm xuống 2 nhưng đang thuê 4
        ]
      });
      expect(result.variants[0].totalStock).toBe(4); // Tự động giới hạn ở 4
      expect(result.variants[0].availableStock).toBe(0); // 1 + (4 - 5)
    });
    test('Add new variant with size not exist', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 5 }, // Giữ nguyên biến thể cũ (size 'L')
          { sku: 'AD-02', size: 'M', totalStock: 3 }  // Thêm biến thể mới (size 'M' chưa tồn tại)
        ]
      });
      expect(result.variants).toHaveLength(2);
      expect(result.variants[1].sku).toBe('AD-02');
      expect(result.variants[1].size).toBe('M');
      expect(result.variants[1].availableStock).toBe(3); // Khởi tạo bằng totalStock
    });

    test('Add new variant with size existed', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 5 }, // Giữ nguyên biến thể cũ (size 'L')
          { sku: 'AD-02', size: 'L', totalStock: 3 }  // Thêm biến thể mới có cùng size 'L' đã tồn tại
        ]
      });
      expect(result.variants).toHaveLength(2);
      expect(result.variants[1].sku).toBe('AD-02');
      expect(result.variants[1].size).toBe('L'); // Size 'L' đã tồn tại ở biến thể thứ nhất
      expect(result.variants[1].availableStock).toBe(3); // Khởi tạo bằng totalStock
    });
    test('Automatically change status to out of stock when stock is zero', async () => {
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 2 } // Giảm tổng kho xuống 2 (nhỏ hơn số lượng đang thuê là 2) => availableStock trở về 0
        ]
      });
      expect(result.variants[0].availableStock).toBe(0);
      expect(result.status).toBe('out_of_stock');
    });
    test('Automatically restore status to available when stock is available again', async () => {
      mockCostumeInstance.status = 'out_of_stock';
      mockCostumeInstance.variants[0].availableStock = 0;
      Costume.findById.mockResolvedValue(mockCostumeInstance);
      const result = await costumeService.updateCostume('costume_id_123', {
        variants: [
          { sku: 'AD-01', totalStock: 10 } // Tăng kho trở lại
        ]
      });
      expect(result.variants[0].availableStock).toBe(5); // 0 + (10 - 5) = 5
      expect(result.status).toBe('available'); // Tự động khôi phục về available
    });
  });

  describe('deleteCostume (Role: Owner)', () => {
    test('Hidden costume', async () => {
      Costume.findById.mockResolvedValue(mockCostume);
      await costumeService.deleteCostume('costume_id_123');
      expect(mockCostume.status).toBe('hidden');
      expect(mockCostume.save).toHaveBeenCalled();
    });

    test('costume to hidden is not found', async () => {
      Costume.findById.mockResolvedValue(null);
      await expect(costumeService.deleteCostume('non_existent_id'))
        .rejects
        .toThrow(new HttpError('Costume not found.', 404));
    });
  });
});
