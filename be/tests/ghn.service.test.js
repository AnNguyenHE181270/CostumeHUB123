process.env.GHN_URL = 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';
process.env.GHN_TOKEN = 'test-token';
process.env.GHN_SHOP_ID = 'test-shop-id';

const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================
// Mock global fetch
// ============================

let mockFetchImpl = null;

global.fetch = async (...args) => {
    if (mockFetchImpl) return mockFetchImpl(...args);
    throw new Error('fetch mock not configured');
};

const ghnService = require('../services/ghn.service');

const mockFetchOk = (data) => {
    mockFetchImpl = async () => ({
        ok: true,
        json: async () => ({ data }),
    });
};

const mockFetchFail = (message) => {
    mockFetchImpl = async () => ({
        ok: false,
        json: async () => ({ message }),
    });
};

const mockFetchThrow = (error) => {
    mockFetchImpl = async () => { throw error; };
};

beforeEach(() => {
    mockFetchImpl = null;
});

describe('getProvinces', () => {
    test('Get provinces successfully', async () => {
        const mockProvinces = [{ ProvinceID: 201, ProvinceName: 'Ha Noi' }];
        mockFetchOk(mockProvinces);

        const result = await ghnService.getProvinces();

        assert.deepStrictEqual(result, mockProvinces);
    });

    test('Throw error when GHN API returns non-ok status', async () => {
        mockFetchFail('Invalid token');

        await assert.rejects(
            async () => ghnService.getProvinces(),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách tỉnh thành GHN'));
                return true;
            }
        );
    });

    test('Throw error when fetch fails (network error)', async () => {
        mockFetchThrow(new Error('Network error'));

        await assert.rejects(
            async () => ghnService.getProvinces(),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách tỉnh thành GHN'));
                return true;
            }
        );
    });
});

describe('getDistricts', () => {
    test('Get districts successfully', async () => {
        const mockDistricts = [{ DistrictID: 2001, DistrictName: 'Cau Giay' }];
        mockFetchOk(mockDistricts);

        const result = await ghnService.getDistricts(201);

        assert.deepStrictEqual(result, mockDistricts);
    });

    test('Throw error when GHN API returns non-ok status', async () => {
        mockFetchFail('Error message');

        await assert.rejects(
            async () => ghnService.getDistricts(201),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách quận huyện GHN'));
                return true;
            }
        );
    });

    test('Throw error when fetch fails', async () => {
        mockFetchThrow(new Error('Network error'));

        await assert.rejects(
            async () => ghnService.getDistricts(201),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách quận huyện GHN'));
                return true;
            }
        );
    });
});

describe('getWards', () => {
    test('Get wards successfully', async () => {
        const mockWards = [{ WardCode: '200101', WardName: 'Dich Vong' }];
        mockFetchOk(mockWards);

        const result = await ghnService.getWards(2001);

        assert.deepStrictEqual(result, mockWards);
    });

    test('Throw error when GHN API returns non-ok status', async () => {
        mockFetchFail('Error message');

        await assert.rejects(
            async () => ghnService.getWards(2001),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách phường xã GHN'));
                return true;
            }
        );
    });

    test('Throw error when fetch fails', async () => {
        mockFetchThrow(new Error('Network error'));

        await assert.rejects(
            async () => ghnService.getWards(2001),
            (err) => {
                assert.ok(err.message.includes('Lỗi lấy danh sách phường xã GHN'));
                return true;
            }
        );
    });
});

describe('createOrder', () => {
    const orderPayload = {
        to_name: 'John Doe',
        to_phone: '0987654321',
        to_address: 'So 1 Duy Tan',
    };

    test('Create order successfully', async () => {
        const mockOrderResponse = { order_code: 'GHN12345' };
        mockFetchOk(mockOrderResponse);

        let capturedUrl = null;
        let capturedOpts = null;
        mockFetchImpl = async (url, opts) => {
            capturedUrl = url;
            capturedOpts = opts;
            return { ok: true, json: async () => ({ data: mockOrderResponse }) };
        };

        const result = await ghnService.createOrder(orderPayload);

        assert.ok(capturedUrl.includes('shipping-order/create'));
        assert.strictEqual(capturedOpts.method, 'POST');
        assert.strictEqual(capturedOpts.headers.Token, 'test-token');
        assert.strictEqual(capturedOpts.headers.ShopId, 'test-shop-id');
        assert.deepStrictEqual(result, mockOrderResponse);
    });

    test('Throw error with API message when GHN returns non-ok with message', async () => {
        mockFetchFail('Payload is invalid');

        await assert.rejects(
            async () => ghnService.createOrder(orderPayload),
            (err) => {
                assert.ok(err.message.includes('Payload is invalid'));
                return true;
            }
        );
    });

    test('Throw default error when GHN returns non-ok without message', async () => {
        mockFetchImpl = async () => ({ ok: false, json: async () => ({}) });

        await assert.rejects(
            async () => ghnService.createOrder(orderPayload),
            (err) => {
                assert.ok(err.message.includes('Lỗi GHN'));
                return true;
            }
        );
    });

    test('Throw error when fetch fails (network error)', async () => {
        mockFetchThrow(new Error('Network error'));

        await assert.rejects(
            async () => ghnService.createOrder(orderPayload),
            (err) => {
                assert.ok(err.message.includes('Network error'));
                return true;
            }
        );
    });
});
