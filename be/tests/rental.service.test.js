const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');
const mongoose = require('mongoose');

let mockData = {};

const getFutureDateStr = (daysFromToday) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysFromToday);
    return d.toISOString();
};

const tomorrowStr = getFutureDateStr(1);
const fourDaysLaterStr = getFutureDateStr(4);

const RentalMock = function (data) {
    Object.assign(this, data);
    this.save = async function () { this._saved = true; return this; };
};

RentalMock.find = (filter) => {
    mockData.rentalFindFilter = filter;
    return {
        populate: function () { return this; },
        sort: async (s) => {
            mockData.rentalSortCalledWith = s;
            return mockData.rentalList || [];
        },
        then: function (resolve) {
            resolve(mockData.rentalList || []);
        },
    };
};
const defaultRentalFindOne = (filter) => {
    mockData.rentalFindOneFilter = filter;
    let result = null;
    if (mockData._rentalFindOneQueue && mockData._rentalFindOneQueue.length > 0) {
        const item = mockData._rentalFindOneQueue.shift();
        if (typeof item === 'function') {
            result = item(filter);
        } else {
            result = item;
        }
    } else {
        result = mockData.rental || null;
    }

    if (result && (typeof result.populate === 'function' || typeof result.then === 'function')) {
        return result;
    }

    return {
        populate: function () { return this; },
        then: function (resolve, reject) {
            resolve(result);
        }
    };
};
RentalMock.findOne = defaultRentalFindOne;
RentalMock.findById = (id) => {
    mockData.rentalFindByIdCalledWith = id;
    if (mockData.rentalFindByIdChain) {
        return { populate: async () => mockData.rentalFindByIdChain };
    }
    return { populate: async () => mockData.rental || null };
};

// ---- CostumeMock ----
const CostumeMock = function (data) { Object.assign(this, data); };
CostumeMock.find = (filter) => {
    mockData.costumeFindFilter = filter;
    return {
        populate: function () { return this; },
        then: function (resolve, reject) {
            resolve(mockData.costumeList || []);
        },
    };
};
CostumeMock.findById = async (id) => {
    mockData.costumeFindByIdCalledWith = id;
    return mockData.costume || null;
};

// ---- UserMock ----
const UserMock = function (data) { Object.assign(this, data); };
UserMock.findById = async (id) => {
    mockData.userFindByIdCalledWith = id;
    return mockData.user || null;
};

// ---- CartMock ----
const CartMock = function (data) { Object.assign(this, data); };
CartMock.findOne = async () => mockData.cart || null;
CartMock.findOneAndDelete = async (filter) => {
    mockData.cartDeleteFilter = filter;
    return mockData.cartDeleted || true;
};

// ---- sendEmail mock ----
let sendEmailCalledWith = null;
const sendEmailMock = async (opts) => {
    sendEmailCalledWith = opts;
    return true;
};

// ---- ghnService mock ----
let ghnCreateOrderImpl = async () => { throw new Error('ghn not configured'); };
const ghnMock = {
    createOrder: async (payload) => ghnCreateOrderImpl(payload),
};

mock('../models/rental.model', RentalMock);
mock('../models/costume.model', CostumeMock);
mock('../models/user.model', UserMock);
mock('../models/cart.model', CartMock);
mock('../models/issue.model', { findOne: async () => null });
mock('../services/email.service', sendEmailMock);
mock('../services/ghn.service', ghnMock);

const rentalService = require('../services/rental.service');
const HttpError = require('../models/http-error.model');

function buildMockRental() {
    const r = new RentalMock({
        _id: 'rental_123',
        customerId: 'user_123',
        items: [
            {
                costume: '60d5ec49c6934c1a48c48a12',
                size: 'L',
                quantity: 1,
                rentalPricePerDay: 33333.33,
                depositPrice: 500000,
            },
        ],
        startDate: new Date(tomorrowStr),
        endDate: new Date(fourDaysLaterStr),
        totalRentalPrice: 300000,
        totalDeposit: 500000,
        totalAmount: 850000,
        shippingFee: 50000,
        status: 'pending',
    });
    return r;
}

function buildMockCostume() {
    return {
        _id: new mongoose.Types.ObjectId('60d5ec49c6934c1a48c48a12'),
        name: 'Ao Dai Red',
        pricePerDay: 100000,
        price: 1000000,
        deposit: 500000,
        minRentalDays: 1,
        variants: [{ size: 'L', totalStock: 5, availableStock: 5 }],
        save: async function () { this._saved = true; },
    };
}

function buildMockUser() {
    return {
        _id: 'user_123',
        fullName: 'Customer One',
        phone: '0123456789',
        email: 'customer@gmail.com',
        balance: 1000000,
        save: async function () { this._saved = true; },
    };
}

function buildMockCart() {
    return {
        customerId: 'user_123',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', startDate: tomorrowStr, endDate: fourDaysLaterStr }],
        save: async function () { this._saved = true; },
    };
}

beforeEach(() => {
    mockData = {};
    sendEmailCalledWith = null;
    ghnCreateOrderImpl = async () => { throw new Error('ghn not configured'); };

    mockData.costume = buildMockCostume();
    mockData.user = buildMockUser();
    mockData.cart = buildMockCart();
    mockData.rental = buildMockRental();
    mockData._rentalFindOneQueue = [];
    RentalMock.findOne = defaultRentalFindOne;
});


describe('createOrder', () => {
    test('Create order successfully', async () => {
        const mockBody = {
            startDate: tomorrowStr,
            endDate: fourDaysLaterStr,
            items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }],
            shippingFee: 50000,
            shippingAddress: { receiverName: 'Customer One', receiverPhone: '0123456789', addressDetail: '123 Test Street' },
            paymentMethod: 'WALLET',
        };

        mockData._rentalFindOneQueue = [null];

        const result = await rentalService.createOrder('user_123', mockBody);

        assert.strictEqual(mockData.costume.variants[0].availableStock, 4);
        assert.ok(mockData.costume._saved);
        assert.ok(mockData.user.balance < 1000000); // deducted
        assert.ok(mockData.user._saved);
        assert.strictEqual(result.customerId, 'user_123');
        assert.strictEqual(result.status, 'pending');
        assert.deepStrictEqual(mockData.cartDeleteFilter, { customerId: 'user_123' });
    });

    test('Costume not found → throws 404', async () => {
        mockData.costume = null;
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: 'non_existent_id', size: 'L', quantity: 1 }] };

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Costume already booked in this timeframe beyond total stock → throws 400', async () => {
        // Kho size L có totalStock = 5. Đã có đơn khác trùng khoảng ngày đặt hết 5 bộ.
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }] };
        mockData.rentalList = [{ items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 5 }] }];

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Costume overlaps another order but combined quantity still within total stock → succeeds', async () => {
        // Kho size L có totalStock = 5, đơn khác đã đặt 3 bộ trùng khoảng ngày, đơn mới đặt 2 bộ vẫn đủ.
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 2 }] };
        mockData.rentalList = [{ items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 3 }] }];

        const result = await rentalService.createOrder('user_123', mockBody);

        assert.strictEqual(result.status, 'pending');
    });

    test('Requested size does not exist → throws 404', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'M', quantity: 1 }] };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Quantity exceeds available stock → throws 400', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 10 }] };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Customer not found → throws 404', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };
        mockData._rentalFindOneQueue = [null];
        mockData.user = null;

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Wallet balance insufficient → throws 400', async () => {
        mockData.user.balance = 50000;
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Start date in the past → throws 400', async () => {
        const mockBody = { startDate: '2020-01-01T00:00:00.000Z', endDate: '2020-01-04T00:00:00.000Z', items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Rental days below minRentalDays → throws 400', async () => {
        mockData.costume.minRentalDays = 3;
        const mockBody = { startDate: tomorrowStr, endDate: getFutureDateStr(2), items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('user_123', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });
});

// ============================
// describe: cancelOrder
// ============================

describe('cancelOrder', () => {
    test('Cancel order successfully → refund balance, restock, send email', async () => {
        const result = await rentalService.cancelOrder('rental_123', 'user_123', 'Changed my mind');

        assert.strictEqual(result.status, 'cancelled');
        assert.strictEqual(result.paymentStatus, 'refunded');
        assert.strictEqual(result.cancelReason, 'Changed my mind');
        assert.strictEqual(mockData.user.balance, 1850000); // 1M + 850k
        assert.ok(mockData.user._saved);
        assert.strictEqual(mockData.costume.variants[0].availableStock, 6); // 5+1
        assert.ok(mockData.costume._saved);
        assert.ok(sendEmailCalledWith);
        assert.strictEqual(sendEmailCalledWith.to, 'customer@gmail.com');
    });

    test('Fail to cancel when status is not pending', async () => {
        mockData.rental.status = 'renting';

        await assert.rejects(
            async () => rentalService.cancelOrder('rental_123', 'user_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Fail to cancel when status is awaitingPayment', async () => {
        mockData.rental.status = 'awaitingPayment';

        await assert.rejects(
            async () => rentalService.cancelOrder('rental_123', 'user_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });
});

// ============================
// describe: getAllOrders
// ============================

describe('getAllOrders', () => {
    test('Get all orders successfully', async () => {
        let populateCallCount = 0;
        const mockOrders = [mockData.rental];

        RentalMock.find = (filter) => {
            mockData.rentalFindFilter = filter;
            return {
                populate: function (path) {
                    populateCallCount++;
                    mockData[`populateCall_${populateCallCount}`] = path;
                    return this;
                },
                sort: async (s) => {
                    mockData.rentalSortCalledWith = s;
                    return mockOrders;
                },
            };
        };

        const result = await rentalService.getAllOrders();

        assert.ok(populateCallCount >= 1);
        assert.deepStrictEqual(mockData.rentalSortCalledWith, { createdAt: -1 });
        assert.deepStrictEqual(result, mockOrders);
    });
});

// ============================
// describe: Return Item
// ============================

describe('Return Item', () => {
    test('Request return successfully when status is renting', async () => {
        mockData.rental.status = 'renting';
        RentalMock.findById = async (id) => { mockData.rentalFindByIdCalledWith = id; return mockData.rental || null; };

        const result = await rentalService.requestReturn('rental_123');

        assert.strictEqual(mockData.rentalFindByIdCalledWith, 'rental_123');
        assert.strictEqual(result.status, 'returning');
        assert.ok(result._saved);
    });

    test('Request return successfully when status is delivering', async () => {
        mockData.rental.status = 'delivering';
        RentalMock.findById = async (id) => { mockData.rentalFindByIdCalledWith = id; return mockData.rental || null; };

        const result = await rentalService.requestReturn('rental_123');

        assert.strictEqual(result.status, 'returning');
    });

    test('Request return successfully when status is overdue', async () => {
        mockData.rental.status = 'overdue';
        RentalMock.findById = async (id) => { return mockData.rental || null; };

        const result = await rentalService.requestReturn('rental_123');

        assert.strictEqual(result.status, 'returning');
    });

    test('Fail to request return when status is invalid (pending)', async () => {
        mockData.rental.status = 'pending';
        RentalMock.findById = async () => mockData.rental;

        await assert.rejects(
            async () => rentalService.requestReturn('rental_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });
});

// ============================
// describe: Confirm Rental
// ============================

describe('Confirm Rental', () => {
    test('Confirm receipt successfully → status becomes renting', async () => {
        mockData.rental.status = 'delivered';

        const result = await rentalService.confirmReceipt('rental_123', 'user_123');

        assert.strictEqual(result.status, 'renting');
        assert.ok(result._saved);
    });

    test('Fail to confirm receipt when order not found', async () => {
        mockData.rental = null;

        await assert.rejects(
            async () => rentalService.confirmReceipt('rental_123', 'user_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Fail to confirm receipt when status is not delivered', async () => {
        mockData.rental.status = 'pending';

        await assert.rejects(
            async () => rentalService.confirmReceipt('rental_123', 'user_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });
});

// ============================
// describe: checkAvailability
// ============================

describe('checkAvailability', () => {
    test('Throw 404 when costume is not found', async () => {
        mockData.costume = null;

        await assert.rejects(
            async () => rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 1 }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Return true when costume is available with enough stock', async () => {
        mockData.rentalList = [];
        RentalMock.find = async () => [];

        const result = await rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 2 });

        assert.deepStrictEqual(result, { isAvailable: true, availableQty: 5 });
    });

    test('Return false when not enough stock due to overlapping rentals', async () => {
        RentalMock.find = async () => [
            { items: [{ costume: '60d5ec49c6934c1a48c48a12', quantity: 2 }] },
            { items: [{ costume: '60d5ec49c6934c1a48c48a12', quantity: 2 }] },
        ];

        const result = await rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 2 });

        assert.deepStrictEqual(result, { isAvailable: false, availableQty: 1 });
    });
});

// ============================
// describe: updateOrderStatus
// ============================

describe('updateOrderStatus', () => {
    test('Throw 404 when order not found', async () => {
        RentalMock.findById = async () => null;

        await assert.rejects(
            async () => rentalService.updateOrderStatus('rental_123', 'delivering'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Successfully update status (non-delivering) → no GHN call', async () => {
        let ghnCalled = false;
        ghnCreateOrderImpl = async () => { ghnCalled = true; return {}; };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('rental_123', 'confirmed');

        assert.strictEqual(result.status, 'confirmed');
        assert.ok(result._saved);
        assert.ok(!ghnCalled);
    });

    test('Push to GHN successfully when status is delivering and address exists', async () => {
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => ({ order_code: 'GHN_ORDER_123' });
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('rental_123', 'delivering');

        assert.strictEqual(result.trackingCode, 'GHN_ORDER_123');
        assert.strictEqual(result.status, 'delivering');
    });

    test('Ignore GHN errors and continue updating status', async () => {
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => { throw new Error('GHN connection failed'); };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('rental_123', 'delivering');

        assert.strictEqual(result.trackingCode, undefined);
        assert.strictEqual(result.status, 'delivering');
        assert.ok(result._saved);
    });
});

// ============================
// describe: confirmPreparation
// ============================

describe('confirmPreparation', () => {
    test('Throw 404 when order not found', async () => {
        RentalMock.findById = async () => null;

        await assert.rejects(
            async () => rentalService.confirmPreparation('rental_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Throw 400 when status is not pending', async () => {
        mockData.rental.status = 'renting';
        RentalMock.findById = async () => mockData.rental;

        await assert.rejects(
            async () => rentalService.confirmPreparation('rental_123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Push to GHN and transition to delivering', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => ({ order_code: 'GHN_ORDER_999' });
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('rental_123');

        assert.strictEqual(mockData.rental.trackingCode, 'GHN_ORDER_999');
        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Xác nhận thành công'));
    });

    test('Transition to delivering with error message when GHN fails', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => { throw new Error('GHN error'); };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('rental_123');

        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Lỗi kết nối GHN'));
    });

    test('Transition to delivering directly when shippingAddress has no districtId', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321' };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('rental_123');

        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Không tạo đơn GHN'));
    });
});

// ============================
// describe: Dashboard Analytics
// ============================

describe('Dashboard Analytics', () => {
    test('Get total revenue successfully', async () => {
        RentalMock.find = async (filter) => {
            mockData.rentalFindFilter = filter;
            return [
                { totalAmount: 100000, createdAt: new Date('2026-01-15') },
                { totalAmount: 250000, createdAt: new Date('2026-01-20') },
            ];
        };

        const result = await rentalService.getTotalRevenue();

        assert.deepStrictEqual(result, {
            totalRevenue: 350000,
            orderCount: 2,
            revenueByMonth: [{ month: '2026-01', total: 350000 }],
        });
    });

    test('Get active rentals successfully', async () => {
        RentalMock.find = async (filter) => {
            mockData.rentalFindFilter = filter;
            return [
                { items: [{ quantity: 2 }, { quantity: 1 }] },
                { items: [{ quantity: 3 }] },
            ];
        };

        const result = await rentalService.getActiveRentals();

        assert.strictEqual(result.activeOrdersCount, 2);
        assert.strictEqual(result.totalActiveCostumes, 6);
    });

    test('getInventoryUtilization → return 0 when total stock is 0', async () => {
        CostumeMock.find = () => ({
            populate: function () { return this; },
            then: (resolve) => resolve([]),
        });

        const result = await rentalService.getInventoryUtilization();

        assert.deepStrictEqual(result, { utilizationPercentage: 0, totalStock: 0, currentlyRented: 0, categoryBreakdown: [] });
    });

    test('getInventoryUtilization → calculate percentage correctly', async () => {
        CostumeMock.find = () => ({
            populate: function () { return this; },
            then: (resolve) => resolve([
                { variants: [{ totalStock: 5 }, { totalStock: 5 }] },
                { variants: [{ totalStock: 10 }] },
            ]),
        });
        RentalMock.find = () => ({
            populate: function () { return this; },
            then: (resolve) => resolve([{ items: [{ quantity: 3 }, { quantity: 2 }] }]),
        });

        const result = await rentalService.getInventoryUtilization();

        assert.deepStrictEqual(result, {
            utilizationPercentage: 25,
            totalStock: 20,
            currentlyRented: 5,
            categoryBreakdown: [{ categoryId: 'unknown', name: 'Chưa phân loại', parentId: null, parentName: null, totalStock: 20, rentedCount: 5 }],
        });
    });
});

// ============================
// describe: extendRental
// ============================

describe('extendRental', () => {
    const newEndDateStr = getFutureDateStr(6);

    test('NewEndDate is missing → throws 400', async () => {
        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', null),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Rental not found → throws 404', async () => {
        RentalMock.findOne = (filter) => ({
            populate: async () => null
        });

        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Rental is not in renting status → throws 400', async () => {
        mockData.rental.status = 'confirmed';
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('NewEndDate not in the future compared to original endDate → throws 400', async () => {
        mockData.rental.status = 'renting';
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', tomorrowStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Costume in order items not found → throws 404', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = null;
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Overlap with another reservation during extension window → throws 400', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = buildMockCostume();

        let callCount = 0;
        RentalMock.findOne = (filter) => {
            callCount++;
            if (callCount === 1) return { populate: async () => mockData.rental };
            return Promise.resolve({ _id: 'overlapping_order' });
        };

        await assert.rejects(
            async () => rentalService.extendRental('rental_123', 'user_123', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Insufficient balance → return payload with insufficientBalance=true', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = buildMockCostume();
        mockData.rental.items[0].rentalPricePerDay = 100000;
        mockData.user.balance = 5000;

        let callCount = 0;
        RentalMock.findOne = (filter) => {
            callCount++;
            if (callCount === 1) return { populate: async () => mockData.rental };
            return Promise.resolve(null);
        };

        const result = await rentalService.extendRental('rental_123', 'user_123', newEndDateStr);

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.insufficientBalance, true);
        assert.strictEqual(result.currentBalance, 5000);
        assert.ok(!mockData.user._saved);
        assert.ok(!mockData.rental._saved);
    });

    test('Successfully extend rental → deduct balance, update endDate and totalAmount', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = buildMockCostume();
        mockData.rental.items[0].rentalPricePerDay = 100000;
        mockData.user.balance = 300000;

        let callCount = 0;
        RentalMock.findOne = (filter) => {
            callCount++;
            if (callCount === 1) return { populate: async () => mockData.rental };
            return Promise.resolve(null);
        };

        const result = await rentalService.extendRental('rental_123', 'user_123', newEndDateStr);

        assert.strictEqual(mockData.user.balance, 290000); // 300k - 10k (gia hạn 2 ngày ở mốc ngày 4-5, phụ phí 5%/ngày)
        assert.ok(mockData.user._saved);
        assert.ok(mockData.rental._saved);
        assert.strictEqual(result.success, true);
        assert.ok(result.message.includes('Gia hạn thuê'));
    });
});