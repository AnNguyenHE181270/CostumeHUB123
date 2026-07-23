const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');

// ============================
// Mock State
// ============================

let mockData = {};

// ---- CostumeMock ----
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

// ---- CategoryMock ----
const CategoryMock = function (data) {
  Object.assign(this, data);
};

CategoryMock.find = (filter) => {
  mockData.categoryFindFilter = filter;
  // Query có parentId -> đang lấy category con của (các) id được truyền vào getAllCostumes;
  // phải thực sự lọc theo id đó (không trả cứng) để test bắt được categoryId sai/gõ nhầm.
  // Query không có parentId -> đang lấy toàn bộ category active.
  let result;
  if (filter && filter.parentId) {
    const targetIds = filter.parentId.$in.map((id) => id.toString());
    result = (mockData.childCategories || []).filter((c) => targetIds.includes(c.parentId?.toString()));
  } else {
    result = mockData.activeCategories || [];
  }
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
    mockData = {};
    CostumeMock.findById = defaultCostumeFindById;
    CostumeMock.find = defaultCostumeFind;
  });

  test('Get all costumes list with full filters', async () => {
    mockData.costumes = [{ _id: 'costume_id_123', name: 'Ao Dai' }];
    mockData.totalItems = 1;
    mockData.activeCategories = [{ _id: '507f1f77bcf86cd799439011' }];
    mockData.childCategories = [];

    const result = await getAllCostumes({
      categoryId: '507f1f77bcf86cd799439011',
      minPrice: '100000',
      maxPrice: '200000',
      status: 'available',
      page: '1',
      limit: '10',
    });

    assert.ok(result.costumes);
    assert.strictEqual(result.costumes.length, 1);
    assert.deepStrictEqual(result.pagination, {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      limit: 10,
    });
    // filter status phải đúng — status='available' giờ lọc theo $ne:'hidden' + variants.availableStock>0
    // (không còn $in:['available']) để không bỏ sót costume có hàng nhưng chưa cập nhật status field.
    assert.deepStrictEqual(mockData.costumeFilter.status, { $ne: 'hidden' });
    assert.deepStrictEqual(mockData.costumeFilter['variants.availableStock'], { $gt: 0 });
    // filter price phải đúng
    assert.deepStrictEqual(mockData.costumeFilter.pricePerDay, { $gte: 100000, $lte: 200000 });
    // filter categoryId phải đúng
    assert.ok(mockData.costumeFilter.categoryId);
  });

  test('Filter costume list by category', async () => {
    mockData.costumes = [{ _id: 'costume_id_123' }];
    mockData.totalItems = 1;
    // category_id_123 là cha, subcategory_id_456 là con của nó — cả 2 đều đang active.
    mockData.activeCategories = [{ _id: 'category_id_123' }, { _id: 'subcategory_id_456' }];
    mockData.childCategories = [{ _id: 'subcategory_id_456', parentId: 'category_id_123' }];

    await getAllCostumes({ categoryId: 'category_id_123678' });

    // Category.find phải được gọi để lấy sub-categories
    assert.ok(mockData.categoryFindFilter !== undefined);
    // filter categoryId phải chứa đúng category cha + category con của nó (không chỉ "có tồn tại")
    assert.deepStrictEqual(
      (mockData.costumeFilter.categoryId.$in || []).map(String).sort(),
      ['category_id_123', 'subcategory_id_456'].sort()
    );
  });

  test('Filter costume list by price range', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({ minPrice: '100000', maxPrice: '200000' });

    assert.deepStrictEqual(mockData.costumeFilter.pricePerDay, { $gte: 100000, $lte: 200000 });
  });

  test('Search costume list by name using regex', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({ search: 'Ao Dai' });

    assert.deepStrictEqual(mockData.costumeFilter.name, { $regex: 'Ao Dai', $options: 'i' });
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

    await getAllCostumes({ sort: 'price_asc' });

    assert.deepStrictEqual(capturedSort, { pricePerDay: 1, _id: 1 });
  });

  test('Pagination: page=2, limit=5 → skip=5', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({ page: '2', limit: '5' });

    assert.strictEqual(mockData.skipValue, 5);   // (2-1)*5
    assert.strictEqual(mockData.limitValue, 5);
  });

  test('Filter by specific status list (available,maintenance)', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({ status: 'available,maintenance' });

    assert.deepStrictEqual(mockData.costumeFilter.status, { $in: ['available', 'maintenance'] });
  });

  test('Get all costume (all status)', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({ status: 'all' });

    // status='all' vẫn ẩn 'hidden' theo mặc định — tránh lộ sản phẩm chủ shop đã ẩn ra API công khai
    // chỉ vì FE truyền status=all. (Muốn thấy cả hidden, dùng endpoint riêng getInventoryCostumes.)
    assert.deepStrictEqual(mockData.costumeFilter.status, { $ne: 'hidden' });
    assert.strictEqual(mockData.costumeFilter['variants.availableStock'], undefined);
  });

  test('Get all costume without hidden status and with available stock', async () => {
    mockData.costumes = [];
    mockData.totalItems = 0;

    await getAllCostumes({});

    assert.strictEqual(mockData.costumeFilter.status, 'available');
    assert.deepStrictEqual(mockData.costumeFilter['variants.availableStock'], { $gt: 0 });
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
