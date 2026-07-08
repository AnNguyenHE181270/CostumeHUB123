const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');


let mockCategoryData = {};

// findById mặc định: trả về mockCategoryData.category
const defaultFindById = async (id) => {
  mockCategoryData.lastFindById = id;
  return mockCategoryData.category || null;
};

const CategoryMock = function (data) {
  Object.assign(this, data);
  this.save = async () => {
    this.saved = true;
    return this;
  };
};

CategoryMock.find = (filter) => {
  mockCategoryData.findFilter = filter;
  return {
    sort: async (sortCondition) => {
      mockCategoryData.sort = sortCondition;
      return mockCategoryData.categories || [];
    }
  };
};

CategoryMock.findOne = async (condition) => {
  mockCategoryData.findOneCondition = condition;
  return mockCategoryData.existing || null;
};

CategoryMock.findById = defaultFindById;

CategoryMock.updateMany = async (condition, update) => {
  mockCategoryData.updateMany = { condition, update };
};

mock('../models/category.model', CategoryMock);

const { getAllCategories, createCategory, updateCategory, toggleCategoryStatus } = require('../services/category.service');
const HttpError = require('../models/http-error.model');


describe('getAllCategories', () => {
  beforeEach(() => {
    mockCategoryData = {};
    CategoryMock.findById = defaultFindById;
  });

  test('Get all categories when queryAll=true → filter {}', async () => {
    mockCategoryData.categories = [
      { name: 'Anime', isActive: false },
      { name: 'Fantasy', isActive: true }
    ];

    const result = await getAllCategories('true');

    assert.deepStrictEqual(mockCategoryData.findFilter, {});
    assert.strictEqual(result.length, 2);
  });

  test('Get only active categories when queryAll=false → filter { isActive: true }', async () => {
    await getAllCategories('false');
    assert.deepStrictEqual(mockCategoryData.findFilter, { isActive: true });
  });

  test('Sort categories by createdAt ascending', async () => {
    await getAllCategories('true');
    assert.deepStrictEqual(mockCategoryData.sort, { createdAt: 1 });
  });
});


describe('createCategory', () => {
  beforeEach(() => {
    mockCategoryData = {};
    CategoryMock.findById = defaultFindById;
  });

  test('Category name already exists → throws 422', async () => {
    mockCategoryData.existing = { name: 'Anime' };

    await assert.rejects(
      async () => createCategory({ name: 'Anime', description: 'Test' }),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.message, 'Tên danh mục đã tồn tại!');
        return true;
      }
    );
  });

  test('Subcategory name same with another parent category name → throws 422', async () => {
    mockCategoryData.existing = { name: 'Anime' };

    await assert.rejects(
      async () => createCategory({ name: 'Anime', description: 'Test', parentId: 'parent_id' }),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.message, 'Tên danh mục đã tồn tại!');
        return true;
      }
    );
  });

  test('Create new category successfully', async () => {
    mockCategoryData.existing = null;

    const result = await createCategory({ name: 'Fantasy', description: 'Costume', parentId: 'parent_id' });

    assert.deepStrictEqual(mockCategoryData.findOneCondition, { name: 'Fantasy' });
    assert.strictEqual(result.name, 'Fantasy');
    assert.strictEqual(result.description, 'Costume');
    assert.strictEqual(result.parentId, 'parent_id');
    assert.strictEqual(result.saved, true);
  });

  test('Create new category successfully with empty description', async () => {
    mockCategoryData.existing = null;

    const result = await createCategory({ name: 'Fantasy', description: '', parentId: 'parent_id' });

    assert.strictEqual(result.name, 'Fantasy');
    assert.strictEqual(result.description, '');
    assert.strictEqual(result.parentId, 'parent_id');
    assert.strictEqual(result.saved, true);
  });

  test('Create category with empty parentId → parentId becomes null', async () => {
    mockCategoryData.existing = null;

    const result = await createCategory({ name: 'Fantasy', description: '', parentId: '' });

    assert.strictEqual(result.parentId, null);
    assert.strictEqual(result.saved, true);
  });
});


describe('updateCategory', () => {
  beforeEach(() => {
    mockCategoryData = {};
    CategoryMock.findById = defaultFindById;
  });

  test('Category not found → throws 404', async () => {
    mockCategoryData.category = null;

    await assert.rejects(
      async () => updateCategory('123', { name: 'New' }),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.message, 'Category not found.');
        return true;
      }
    );
  });

  test('New name already exists elsewhere → throws 422', async () => {
    mockCategoryData.category = {
      _id: 'cat_1',
      name: 'Original',
      save: async function () { this.saved = true; }
    };
    mockCategoryData.existing = { _id: 'cat_2', name: 'Duplicate' };

    await assert.rejects(
      async () => updateCategory('cat_1', { name: 'Duplicate' }),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.message, 'Category name already exists.');
        return true;
      }
    );
  });

  test('Update fields and save successfully', async () => {
    mockCategoryData.category = {
      _id: 'cat_1',
      name: 'Original',
      description: 'Old Desc',
      parentId: 'parent_old',
      save: async function () { this.saved = true; }
    };
    mockCategoryData.existing = null;

    const result = await updateCategory('cat_1', {
      name: 'New Name',
      description: 'New Desc',
      parentId: 'parent_new'
    });

    assert.strictEqual(result.name, 'New Name');
    assert.strictEqual(result.description, 'New Desc');
    assert.strictEqual(result.parentId, 'parent_new');
    assert.strictEqual(result.saved, true);
  });

  test('Update category that has inactive status → isActive stays false', async () => {
    mockCategoryData.category = {
      _id: 'cat_1',
      name: 'Old Name',
      description: 'Old Desc',
      isActive: false,                // category đang inactive
      save: async function () { this.saved = true; }
    };
    mockCategoryData.existing = null;

    const result = await updateCategory('cat_1', {
      name: 'New Name Inactive',
      description: 'New Desc Inactive'
      // isActive KHÔNG được truyền vào → service không đụng tới isActive
    });

    assert.strictEqual(result.name, 'New Name Inactive');
    assert.strictEqual(result.description, 'New Desc Inactive');
    assert.strictEqual(result.isActive, false); // isActive KHÔNG thay đổi
    assert.strictEqual(result.saved, true);
  });

  test('Update subcategory whose parent has inactive status → only name/parentId updated', async () => {
    // updateCategory không check trạng thái của parent → chỉ update tên và parentId
    mockCategoryData.category = {
      _id: 'cat_1',
      name: 'Subcategory',
      parentId: 'parent_inactive',
      isActive: true,
      save: async function () { this.saved = true; }
    };
    mockCategoryData.existing = null;

    const result = await updateCategory('cat_1', {
      name: 'Updated Subcategory',
      parentId: 'parent_inactive'
    });

    assert.strictEqual(result.name, 'Updated Subcategory');
    assert.strictEqual(result.parentId, 'parent_inactive');
    assert.strictEqual(result.isActive, true); // isActive không bị đổi
    assert.strictEqual(result.saved, true);
  });
});

describe('toggleCategoryStatus', () => {
  beforeEach(() => {
    mockCategoryData = {};
    CategoryMock.findById = defaultFindById; // reset về mặc định
  });

  test('Category not found → throws 404', async () => {
    mockCategoryData.category = null;

    await assert.rejects(
      async () => toggleCategoryStatus('123', false),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.message, 'Category not found.');
        return true;
      }
    );
  });

  test('Disable parent category (parentId=null) → isActive becomes false', async () => {
    mockCategoryData.category = {
      isActive: true,
      parentId: null,         // là parent category, không có cha
      save: async function () { this.saved = true; }
    };

    const result = await toggleCategoryStatus('123', false);

    assert.strictEqual(result.isActive, false);
    assert.strictEqual(result.saved, true);
  });

  test('Restore child category when parent is inactive → throws 400', async () => {
    const childCat = {
      _id: '123',
      isActive: false,
      parentId: 'parent01',
      save: async function () { this.saved = true; }
    };
    const parentCat = { _id: 'parent01', isActive: false };

    // Override findById để phân biệt child vs parent theo id
    CategoryMock.findById = async (id) => {
      if (id === 'parent01') return parentCat;
      return childCat;
    };

    await assert.rejects(
      async () => toggleCategoryStatus('123', true),
      (error) => {
        assert.ok(error instanceof HttpError);
        assert.strictEqual(error.statusCode, 400);
        assert.strictEqual(error.message, 'Không thể khôi phục danh mục con khi danh mục cha đang bị ẩn.');
        return true;
      }
    );
  });

  test('Toggle subcategory to active when parent is active', async () => {
    const childCat = {
      _id: '123',
      isActive: false,
      parentId: 'parent01',
      save: async function () { this.saved = true; }
    };
    const parentCat = { _id: 'parent01', isActive: true };

    CategoryMock.findById = async (id) => {
      if (id === 'parent01') return parentCat;
      return childCat;
    };

    const result = await toggleCategoryStatus('123', true);

    assert.strictEqual(result.isActive, true);
    assert.strictEqual(result.saved, true);
  });

  test('Toggle subcategory to inactive when parent is active', async () => {
    const childCat = {
      _id: '123',
      isActive: true,
      parentId: 'parent01',
      save: async function () { this.saved = true; }
    };
    const parentCat = { _id: 'parent01', isActive: true };

    CategoryMock.findById = async (id) => {
      if (id === 'parent01') return parentCat;
      return childCat;
    };

    // isActive=false → service không check parent, chỉ save
    const result = await toggleCategoryStatus('123', false);

    assert.strictEqual(result.isActive, false);
    assert.strictEqual(result.saved, true);
  });

  test('Parent converts to active but subcategory still inactive → toggling to active is allowed', async () => {
    const childCat = {
      _id: '123',
      isActive: false,
      parentId: 'parent01',
      save: async function () { this.saved = true; }
    };
    const parentCat = { _id: 'parent01', isActive: true }; // parent đã active

    CategoryMock.findById = async (id) => {
      if (id === 'parent01') return parentCat;
      return childCat;
    };

    const result = await toggleCategoryStatus('123', true);

    assert.strictEqual(result.isActive, true);
    assert.strictEqual(result.saved, true);
  });
});
