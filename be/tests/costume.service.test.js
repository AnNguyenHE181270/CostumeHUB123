const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');

const MOCK_COSTUMES = [
  {
    _id: 'costume_id_123',
    name: 'Áo Dài Truyền Thống',
    slug: 'ao-dai-truyen-thong',
    sku: 'AD-001',
    categoryId: 'category_id_123',
    description: 'Áo dài lụa tơ tằm cao cấp',
    images: ['image1.jpg'],
    size: 'M',
    color: 'Đỏ',
    condition: 'Mới 100%',
    pricePerDay: 150000,
    price: 500000,
    deposit: 300000,
    minRentalDays: 1,
    lateFeePerDay: 50000,
    status: 'available',
    specifications: { weight: '0.5kg' },
    variants: [
      {
        _id: 'variant_1',
        size: 'M',
        availableStock: 5,
        totalStock: 5,
        status: 'available',
        instances: [
          { unitCode: 'M-001', status: 'available' }
        ]
      }
    ],
    createdBy: 'user_id_1'
  },
  {
    _id: 'costume_id_456',
    name: 'Áo Tấc Ngũ Thân',
    slug: 'ao-tac-ngu-than',
    sku: 'AT-001',
    categoryId: 'category_id_124',
    description: 'Áo tấc truyền thống Việt Nam',
    images: ['image2.jpg'],
    size: 'L',
    color: 'Xanh dương',
    condition: 'Mới 90%',
    pricePerDay: 200000,
    price: 600000,
    deposit: 400000,
    minRentalDays: 1,
    lateFeePerDay: 60000,
    status: 'available',
    specifications: { weight: '0.7kg' },
    variants: [
      {
        _id: 'variant_2',
        size: 'L',
        availableStock: 2,
        totalStock: 3,
        status: 'available',
        instances: [
          { unitCode: 'L-001', status: 'available' },
          { unitCode: 'L-002', status: 'available' },
          { unitCode: 'L-003', status: 'rented' }
        ]
      }
    ],
    createdBy: 'user_id_1'
  }
];

let mockData = {
  costumes: JSON.parse(JSON.stringify(MOCK_COSTUMES)),
  totalItems: MOCK_COSTUMES.length,
  costume: JSON.parse(JSON.stringify(MOCK_COSTUMES[0])),
  childCategories: [],
};

const CostumeMock = function (data) {
  Object.assign(this, data);
  this.save = async () => {
    this.saved = true;
    return this;
  };
};

const defaultCostumeFindById = async (id) => {
  mockData.lastFindById = id;
  return mockData.costume || null;
};

const defaultCostumeFind = (filter) => {
  mockData.costumeFilter = filter;
  return {
    populate: function () { return this; },
    sort: function () { return this; },
    skip: function (n) { mockData.skipValue = n; return this; },
    limit: async (n) => { mockData.limitValue = n; return mockData.costumes || []; },
  };
};

CostumeMock.find = defaultCostumeFind;

CostumeMock.countDocuments = async (filter) => {
  mockData.countFilter = filter;
  return mockData.totalItems ?? 0;
};

CostumeMock.findById = defaultCostumeFindById;

const CategoryMock = function (data) {
  Object.assign(this, data);
};

CategoryMock.find = (filter) => {
  mockData.categoryFindFilter = filter;
  const result = mockData.childCategories || [];
  return {
    select: async function (fields) {
      return result;
    },
    then: function (resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
};

mock('../models/costume.model', CostumeMock);
mock('../models/category.model', CategoryMock);

const { getAllCostumes, getCostumeById, createCostume, updateCostume, deleteCostume } = require('../services/costume.service');
const HttpError = require('../models/http-error.model');


describe('getAllCostumes', () => {
  beforeEach(() => {
    mockData = {
      costumes: JSON.parse(JSON.stringify(MOCK_COSTUMES)),
      totalItems: MOCK_COSTUMES.length,
      costume: JSON.parse(JSON.stringify(MOCK_COSTUMES[0])),
      childCategories: [],
    };
    CostumeMock.findById = defaultCostumeFindById;
    CostumeMock.find = defaultCostumeFind;
  });

  test('Filter costume list by category', async () => {
    mockData.childCategories = [{ _id: 'category_id_123' }];
    // B. CHẠY HÀM (Client truyền tham số)
    const result = await getAllCostumes({ categoryId: 'category_id_123' });
    // C. MỤC ĐÍCH CHÍNH: Test xem Service có dịch tham số thành câu lệnh MongoDB chuẩn không
    assert.deepStrictEqual(mockData.costumeFilter.categoryId, { $in: ['category_id_123'] });

    // D. Test phụ: Đảm bảo dữ liệu DB ném cho Service không bị Service làm rơi rớt trên đường về
    assert.strictEqual(result.costumes.length, 2); // Do MOCK_COSTUMES mặc định có 2 bộ
  });


  test('Get all costumes list', async () => {
    const result = await getAllCostumes({});

    assert.ok(result.costumes);
    assert.deepStrictEqual(result.pagination, {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      limit: 9,
    });
  });

  test('Filter costume list by price range', async () => {
    const result = await getAllCostumes({ minPrice: '100000', maxPrice: '200000' });

    assert.deepStrictEqual(mockData.costumeFilter.pricePerDay, { $gte: 100000, $lte: 200000 });
    assert.strictEqual(result.costumes.length, 2);
    assert.strictEqual(result.pagination.totalItems, 2);
  });

  test('Search costume list by name using regex', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    const result = await getAllCostumes({ search: 'Ao Dai' });

    assert.deepStrictEqual(mockData.costumeFilter.name, { $regex: 'Ao Dai', $options: 'i' });
    assert.deepStrictEqual(result.costumes, []);
    assert.strictEqual(result.pagination.totalItems, 0);
  });

  test('Sort costume list by price ascending', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;
    let capturedSort = null;

    CostumeMock.find = (filter) => {
      mockData.costumeFilter = filter;
      return {
        populate: function () { return this; },
        sort: function (s) { capturedSort = s; return this; },
        skip: function () { return this; },
        limit: async () => [],
      };
    };

    const result = await getAllCostumes({ sort: 'price_asc' });

    assert.deepStrictEqual(capturedSort, { pricePerDay: 1, _id: 1 });
    assert.deepStrictEqual(result.costumes, []);
    assert.strictEqual(result.pagination.totalItems, 0);
  });

  test('Pagination: page=2, limit=5 → skip=5', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    const result = await getAllCostumes({ page: '2', limit: '5' });

    assert.strictEqual(mockData.skipValue, 5);   // (2-1)*5
    assert.strictEqual(mockData.limitValue, 5);
    assert.deepStrictEqual(result.costumes, []);
    assert.strictEqual(result.pagination.totalItems, 0);
  });

  test('Filter by specific status list (hidden)', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    const result = await getAllCostumes({ status: 'hidden' });

    assert.deepStrictEqual(mockData.costumeFilter.status, { $in: ['hidden'] });
    assert.deepStrictEqual(result.costumes, []);
    assert.strictEqual(result.pagination.totalItems, 0);
  });

  test('Get all costume without hidden status and with available stock', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    const result = await getAllCostumes({});

    assert.strictEqual(mockData.costumeFilter.status, 'available');
    assert.deepStrictEqual(mockData.costumeFilter['variants.availableStock'], { $gt: 0 });
    assert.deepStrictEqual(result.costumes, []);
    assert.strictEqual(result.pagination.totalItems, 0);
  });
});

describe('getCostumeById', () => {
  beforeEach(() => {
    mockData = {};
    CostumeMock.findById = (id) => {
      mockData.lastFindById = id;
      return {
        populate: async () => mockData.costume || null,
      };
    };
  });

  test('Get costume details successfully', async () => {
    mockData.costume = { _id: 'costume_id_123', name: 'Ao Dai' };

    const result = await getCostumeById('costume_id_123');

    assert.strictEqual(mockData.lastFindById, 'costume_id_123');
    assert.strictEqual(result._id, 'costume_id_123');
    assert.strictEqual(result.name, 'Ao Dai');
  });

  test('Costume not found', async () => {
    mockData.costume = null;

    await assert.rejects(
      async () => getCostumeById('non_existent_id'),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.message, 'Costume not found.');
        return true;
      }
    );
  });
});


describe('createCostume', () => {
  beforeEach(() => {
    mockData = {};
    CostumeMock.findById = defaultCostumeFindById;
  });

  test('Create costume successfully', async () => {
    const inputData = {
      name: 'Ao Dai Viet Nam',
      sku: 'AD-001',
      categoryId: 'category_id_123',
      pricePerDay: 150000,
      variants: [{ size: 'L', color: 'Red', totalStock: 5 }],
    };

    const result = await createCostume(inputData, 'owner_user_id_123');

    assert.strictEqual(result.createdBy, 'owner_user_id_123');
    assert.strictEqual(result.name, 'Ao Dai Viet Nam');
    assert.strictEqual(result.saved, true);
  });

  test('Add new costume with minimal required data → defaults applied', async () => {
    const minimalData = {
      name: 'Ao Dai Hoc Sinh',
      sku: 'ADHS-001',
      categoryId: 'category_id_999',
    };

    const result = await createCostume(minimalData, 'owner_user_id_123');

    assert.strictEqual(result.name, 'Ao Dai Hoc Sinh');
    assert.strictEqual(result.sku, 'ADHS-001');
    assert.deepStrictEqual(result.images, []);
    assert.strictEqual(result.pricePerDay, 0);
    assert.strictEqual(result.price, 0);
    assert.strictEqual(result.deposit, 0);
    assert.strictEqual(result.minRentalDays, 1);
    assert.strictEqual(result.lateFeePerDay, 0);
    assert.strictEqual(result.status, 'available');
    assert.deepStrictEqual(result.specifications, {});
    assert.deepStrictEqual(result.variants, []);
  });

  test('availableStock = totalStock for each variant when created', async () => {
    const dataWithVariants = {
      name: 'Ao Dai Test',
      sku: 'AD-TEST-002',
      categoryId: 'category_id_123',
      variants: [
        { size: 'S', color: 'Red', totalStock: 10 },
        { size: 'M', color: 'Red', totalStock: 0 },
        { size: 'L', color: 'Red' },  // thiếu totalStock
      ],
    };

    const result = await createCostume(dataWithVariants, 'owner_user_id_123');

    assert.strictEqual(result.variants[0].availableStock, 10);
    assert.strictEqual(result.variants[1].availableStock, 0);
    assert.strictEqual(result.variants[2].availableStock, 0);
  });
});


describe('updateCostume', () => {
  let mockCostumeInstance;

  beforeEach(() => {
    mockData = {};
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
          availableStock: 3,   // đang thuê: 5 - 3 = 2
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
      save: async function () { this.saved = true; },
    };
    CostumeMock.findById = async (id) => {
      mockData.lastFindById = id;
      return mockData.costume || null;
    };
    mockData.costume = mockCostumeInstance;
  });

  test('Should throw 404 if costume to update is not found', async () => {
    mockData.costume = null;

    await assert.rejects(
      async () => updateCostume('non_existent_id', { name: 'New Name' }),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.message, 'Costume not found.');
        return true;
      }
    );
  });

  test('Successfully update costume fields (name, pricePerDay)', async () => {
    const result = await updateCostume('costume_id_123', {
      name: 'Ao Dai Co Dien',
      pricePerDay: 200000,
      variants: [{ sku: 'AD-01', totalStock: 10 }],
    });

    assert.strictEqual(result.name, 'Ao Dai Co Dien');
    assert.strictEqual(result.pricePerDay, 200000);
    assert.strictEqual(result.variants[0].totalStock, 10);
    assert.strictEqual(result.variants[0].availableStock, 8); // 3 + (10-5)
    assert.strictEqual(result.saved, true);
  });

  test('Increase total stock → availableStock increases by the diff', async () => {
    const result = await updateCostume('costume_id_123', {
      variants: [{ sku: 'AD-01', totalStock: 10 }],  // tăng từ 5 lên 10
    });

    assert.strictEqual(result.variants[0].totalStock, 10);
    assert.strictEqual(result.variants[0].availableStock, 8); // 3 + (10-5)
  });

  test('Decrease total stock (still > rented quantity) → availableStock decreases', async () => {
    const result = await updateCostume('costume_id_123', {
      variants: [{ sku: 'AD-01', totalStock: 4 }],  // giảm từ 5 xuống 4; đang thuê=2
    });

    assert.strictEqual(result.variants[0].totalStock, 4);
    assert.strictEqual(result.variants[0].availableStock, 2); // 3 + (4-5)
  });

  test('Do not allow reducing total stock below rented quantity → clamped to rentedCount', async () => {
    mockCostumeInstance.variants[0].availableStock = 1; // đang thuê = 5-1 = 4

    const result = await updateCostume('costume_id_123', {
      variants: [{ sku: 'AD-01', totalStock: 2 }],  // muốn giảm xuống 2 nhưng thuê 4
    });

    assert.strictEqual(result.variants[0].totalStock, 4);  // clamped to rentedCount
    assert.strictEqual(result.variants[0].availableStock, 0); // 1 + (4-5) = 0
  });

  test('Add new variant with a new SKU (size not existed)', async () => {
    const result = await updateCostume('costume_id_123', {
      variants: [
        { sku: 'AD-01', totalStock: 5 },               // giữ nguyên
        { sku: 'AD-02', size: 'M', totalStock: 3 },    // thêm mới
      ],
    });

    assert.strictEqual(result.variants.length, 2);
    assert.strictEqual(result.variants[1].sku, 'AD-02');
    assert.strictEqual(result.variants[1].size, 'M');
    assert.strictEqual(result.variants[1].availableStock, 3); // = totalStock (mới)
  });

  test('Add new variant with same size as existing', async () => {
    const result = await updateCostume('costume_id_123', {
      variants: [
        { sku: 'AD-01', totalStock: 5 },               // cũ size 'L'
        { sku: 'AD-02', size: 'L', totalStock: 3 },    // mới cùng size 'L'
      ],
    });

    assert.strictEqual(result.variants.length, 2);
    assert.strictEqual(result.variants[1].sku, 'AD-02');
    assert.strictEqual(result.variants[1].size, 'L');
    assert.strictEqual(result.variants[1].availableStock, 3);
  });

  test('Automatically change status to out_of_stock when all availableStock = 0', async () => {
    // totalStock=2, đang thuê=2 → availableStock sẽ = 0
    const result = await updateCostume('costume_id_123', {
      variants: [{ sku: 'AD-01', totalStock: 2 }],
    });

    assert.strictEqual(result.variants[0].availableStock, 0);
    assert.strictEqual(result.status, 'out_of_stock');
  });

  test('Automatically restore status to available when stock is replenished', async () => {
    mockCostumeInstance.status = 'out_of_stock';
    mockCostumeInstance.variants[0].availableStock = 0;

    const result = await updateCostume('costume_id_123', {
      variants: [{ sku: 'AD-01', totalStock: 10 }],  // tăng kho trở lại
    });

    assert.strictEqual(result.variants[0].availableStock, 5); // 0 + (10-5)
    assert.strictEqual(result.status, 'available');
  });
});

describe('deleteCostume', () => {
  beforeEach(() => {
    mockData = {};
    CostumeMock.findById = defaultCostumeFindById;
  });

  test('Hide costume → status becomes "hidden"', async () => {
    mockData.costume = {
      _id: 'costume_id_123',
      status: 'available',
      save: async function () { this.saved = true; },
    };

    await deleteCostume('costume_id_123');

    assert.strictEqual(mockData.costume.status, 'hidden');
    assert.strictEqual(mockData.costume.saved, true);
  });

  test('Costume to hide not found', async () => {
    mockData.costume = null;

    await assert.rejects(
      async () => deleteCostume('non_existent_id'),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.message, 'Costume not found.');
        return true;
      }
    );
  });
});
