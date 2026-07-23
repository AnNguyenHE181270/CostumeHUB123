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
        session: function () { return this; },
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

    // .select() phải chainable như Mongoose thật (query builder trả về chính nó) — cancelOrder()
    // gọi Rental.findOne(...).select("+cancelOtpCode ..."); thiếu method này mock ném TypeError
    // "select is not a function", khiến MỌI test cancelOrder fail vì lỗi hạ tầng test chứ không
    // phải vì service sai — che mất kết quả thật của assertion.
    const chain = {
        populate: function () { return this; },
        select: function () { return this; },
        then: function (resolve, reject) {
            resolve(result);
        }
    };
    return chain;
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
// findById phải vừa await trực tiếp được (User.findById(id)) vừa chain .session() được
// (User.findById(id).session(session), dùng trong transaction của createOrder).
const UserMock = function (data) { Object.assign(this, data); };
UserMock.findById = (id) => {
    mockData.userFindByIdCalledWith = id;
    return {
        session: function () { return this; },
        then: function (resolve, reject) { resolve(mockData.user || null); },
    };
};
// updateOne mock
UserMock.updateOne = async (filter, update) => {
    mockData.userUpdateOneCalledWith = { filter, update };
    return { acknowledged: true, modifiedCount: mockData.user ? 1 : 0 };
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
// email.service.js export thật là sendEmail() có gắn thêm renderEmailHtml() (helper dựng layout mail
// chung) như 1 property trên chính hàm — mock cũng phải có property này, nếu không code gọi
// sendEmail.renderEmailHtml(...) sẽ ném lỗi bị try/catch nuốt mất, khiến sendEmail() không bao giờ
// thực sự được gọi (bug ẩn từng khiến test "Cancel order" fail sau khi thêm template mail chung).
sendEmailMock.renderEmailHtml = (opts) => `<mock-email>${JSON.stringify(opts)}</mock-email>`;

// ---- ghnService mock ----
let ghnCreateOrderImpl = async () => { throw new Error('ghn not configured'); };
const ghnMock = {
    createOrder: async (payload) => ghnCreateOrderImpl(payload),
};

// ---- notificationService mock ----
// notifyOrderStatus() trong rental.service.js gọi notificationService.createNotification() bọc trong
// try/catch (chỉ console.error, không ném lỗi ra ngoài) — nếu KHÔNG mock module này, nó gọi thẳng
// Notification.create() thật (model Mongoose thật, không có kết nối DB trong test) khiến Mongoose
// buffer lệnh ghi rồi timeout sau ~10s (bufferTimeoutMS mặc định), lỗi đó bị try/catch nuốt mất nên
// test vẫn pass — chỉ chậm âm thầm và không bao giờ phát hiện được bug thật trong luồng thông báo.
let notificationCalls = [];
const notificationServiceMock = {
    createNotification: async (payload) => { notificationCalls.push(payload); return payload; },
};

mock('../models/rental.model', RentalMock);
mock('../models/costume.model', CostumeMock);
mock('../models/user.model', UserMock);
mock('../models/cart.model', CartMock);
mock('../models/issue.model', {
    findOne: async () => null,
    // getAllOrders() gọi Issue.find({rentalId:{$in:...}}).select(...) để gắn khiếu nại liên kết vào
    // từng đơn — mặc định không có khiếu nại nào (mảng rỗng) trừ khi 1 test cụ thể tự override.
    find: () => ({ select: async () => [] }),
});
mock('../services/email.service', sendEmailMock);
mock('../services/ghn.service', ghnMock);
mock('../services/notification.service', notificationServiceMock);

// createOrder chạy trong mongoose transaction (session.withTransaction) — không có DB thật/replica set
// trong môi trường test nên mongoose.startSession() thật sẽ treo rồi timeout. Toàn bộ model trong
// transaction đã được mock ở trên (không thao tác DB thật), nên chỉ cần session giả chạy callback trực tiếp.
mongoose.startSession = async () => ({
    withTransaction: async (fn) => fn(),
    endSession: async () => {},
});

const rentalService = require('../services/rental.service');
const HttpError = require('../models/http-error.model');

function buildMockRental() {
    const r = new RentalMock({
        _id: '507f191e810c19729de860ea',
        customerId: '507f1f77bcf86cd799439011',
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
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Customer One',
        phone: '0123456789',
        email: 'customer@gmail.com',
        save: async function () { this._saved = true; },
    };
}

function buildMockCart() {
    return {
        customerId: '507f1f77bcf86cd799439011',
        items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', startDate: tomorrowStr, endDate: fourDaysLaterStr }],
        save: async function () { this._saved = true; },
    };
}

beforeEach(() => {
    mockData = {};
    sendEmailCalledWith = null;
    notificationCalls = [];
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
            paymentMethod: 'VNPAY',
        };

        mockData._rentalFindOneQueue = [null];

        const result = await rentalService.createOrder('507f1f77bcf86cd799439011', mockBody);

        assert.strictEqual(mockData.costume.variants[0].availableStock, 4);
        assert.ok(mockData.costume._saved);
        assert.strictEqual(result.customerId, '507f1f77bcf86cd799439011');
        assert.strictEqual(result.status, 'pending');
        assert.deepStrictEqual(mockData.cartDeleteFilter, { customerId: '507f1f77bcf86cd799439011' });
    });

    test('Costume not found → throws 404', async () => {
        mockData.costume = null;
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: 'non_existent_id', size: 'L', quantity: 1 }] };

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    // Đã bỏ 2 test cũ "Costume already booked... / overlaps another order..." — chúng test khả năng
    // gộp số lượng của các đơn KHÁC trùng khoảng ngày qua Rental.find() (mockData.rentalList), một cơ
    // chế đặt-theo-khung-ngày đã bị thay thế hoàn toàn từ khi createOrder chuyển sang chấm dứt/giữ chỗ
    // qua instances[] (markInstancesRented) — availableStock giờ LUÔN phản ánh đúng tồn kho thời gian
    // thực, không cần tự cộng dồn các đơn khác nữa. Coverage tương đương đã có ở
    // 'Quantity exceeds available stock → throws 400' bên dưới.

    test('Requested size does not exist → throws 404', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'M', quantity: 1 }] };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Quantity exceeds available stock → throws 400', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 10 }] };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Customer not found → throws 404', async () => {
        const mockBody = { startDate: tomorrowStr, endDate: fourDaysLaterStr, items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };
        mockData._rentalFindOneQueue = [null];
        mockData.user = null;

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Start date in the past → throws 400', async () => {
        const mockBody = { startDate: '2020-01-01T00:00:00.000Z', endDate: '2020-01-04T00:00:00.000Z', items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Rental days below minRentalDays → throws 400', async () => {
        mockData.costume.minRentalDays = 3;
        const mockBody = { startDate: tomorrowStr, endDate: getFutureDateStr(2), items: [{ costume: '60d5ec49c6934c1a48c48a12', size: 'L', quantity: 1 }], shippingFee: 50000 };
        mockData._rentalFindOneQueue = [null];

        await assert.rejects(
            async () => rentalService.createOrder('507f1f77bcf86cd799439011', mockBody),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });
});

// ============================
// describe: cancelOrder
// ============================

describe('cancelOrder', () => {
    test('Cancel order successfully → restock, send email', async () => {
        // paymentStatus chỉ được set 'refunded' nếu đơn ĐÃ thanh toán — dùng Cash (không phải VNPAY)
        // để bỏ qua nhánh xác thực OTP hoàn tiền ngân hàng, giữ test tập trung vào cancel + restock.
        mockData.rental.paymentMethod = 'Cash';
        mockData.rental.paymentStatus = 'paid';
        // Đơn thuê 1 chiếc size L đang giữ chỗ -> mô phỏng đúng trạng thái kho trước khi hủy: kho còn
        // 4/5 sẵn sàng (1 chiếc đang gắn cho đơn này). Hủy đơn phải nhả đúng 1 chiếc đó về kho, tổng
        // không bao giờ vượt totalStock=5 — bug cũ ("5 → 6") từng cho phép vượt do nhả sai instance.
        mockData.costume.variants[0].availableStock = 4;

        const result = await rentalService.cancelOrder('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', 'Changed my mind');

        assert.strictEqual(result.status, 'cancelled');
        assert.strictEqual(result.paymentStatus, 'refunded');
        assert.strictEqual(result.cancelReason, 'Changed my mind');
        assert.strictEqual(mockData.costume.variants[0].availableStock, 5); // 4+1, không vượt totalStock=5
        assert.ok(mockData.costume._saved);
        assert.ok(sendEmailCalledWith);
        assert.strictEqual(sendEmailCalledWith.to, 'customer@gmail.com');
    });

    test('Fail to cancel when status is not pending', async () => {
        mockData.rental.status = 'renting';

        await assert.rejects(
            async () => rentalService.cancelOrder('507f191e810c19729de860ea', '507f1f77bcf86cd799439011'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Fail to cancel when status is awaitingPayment', async () => {
        mockData.rental.status = 'awaitingPayment';

        await assert.rejects(
            async () => rentalService.cancelOrder('507f191e810c19729de860ea', '507f1f77bcf86cd799439011'),
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
                // getAllOrders() giờ gọi thêm .lean() sau .sort() (để gắn thêm order.issue mà không
                // cần Mongoose document) — trả object vừa chainable (.lean()) vừa await trực tiếp được.
                sort: (s) => {
                    mockData.rentalSortCalledWith = s;
                    return {
                        lean: async () => mockOrders,
                        then: (resolve) => resolve(mockOrders),
                    };
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

        const result = await rentalService.requestReturn('507f191e810c19729de860ea');

        assert.strictEqual(mockData.rentalFindByIdCalledWith, '507f191e810c19729de860ea');
        assert.strictEqual(result.status, 'returning');
        assert.ok(result._saved);
    });

    test('Request return successfully when status is delivering', async () => {
        mockData.rental.status = 'delivering';
        RentalMock.findById = async (id) => { mockData.rentalFindByIdCalledWith = id; return mockData.rental || null; };

        const result = await rentalService.requestReturn('507f191e810c19729de860ea');

        assert.strictEqual(result.status, 'returning');
    });

    test('Request return successfully when status is overdue', async () => {
        mockData.rental.status = 'overdue';
        RentalMock.findById = async (id) => { return mockData.rental || null; };

        const result = await rentalService.requestReturn('507f191e810c19729de860ea');

        assert.strictEqual(result.status, 'returning');
    });

    test('Fail to request return when status is invalid (pending)', async () => {
        mockData.rental.status = 'pending';
        RentalMock.findById = async () => mockData.rental;

        await assert.rejects(
            async () => rentalService.requestReturn('507f191e810c19729de860ea'),
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

        const result = await rentalService.confirmReceipt('507f191e810c19729de860ea', '507f1f77bcf86cd799439011');

        assert.strictEqual(result.status, 'renting');
        assert.ok(result._saved);
    });

    test('Fail to confirm receipt when order not found', async () => {
        mockData.rental = null;

        await assert.rejects(
            async () => rentalService.confirmReceipt('507f191e810c19729de860ea', '507f1f77bcf86cd799439011'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Fail to confirm receipt when status is not delivered', async () => {
        mockData.rental.status = 'pending';

        await assert.rejects(
            async () => rentalService.confirmReceipt('507f191e810c19729de860ea', '507f1f77bcf86cd799439011'),
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

    // checkAvailability() giờ chỉ đọc thẳng variant.availableStock (nguồn sự thật thời gian thực từ
    // instances[]) — không còn tự cộng dồn các đơn khác trùng ngày qua Rental.find() nữa, nên không
    // cần mock RentalMock.find ở đây (đã xoá test "overlapping rentals" cũ dựa trên cơ chế cũ đó).
    test('Return true when costume is available with enough stock', async () => {
        const result = await rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 2 });

        assert.deepStrictEqual(result, { isAvailable: true, availableQty: 5 });
    });

    test('Return false when requested quantity exceeds availableStock', async () => {
        mockData.costume.variants[0].availableStock = 1;

        const result = await rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 2 });

        assert.deepStrictEqual(result, { isAvailable: false, availableQty: 1 });
    });

    test('No size specified → sum availableStock across all variants', async () => {
        mockData.costume.variants = [
            { size: 'S', totalStock: 3, availableStock: 2 },
            { size: 'L', totalStock: 5, availableStock: 3 },
        ];

        const result = await rentalService.checkAvailability({ costumeId: '60d5ec49c6934c1a48c48a12', startDate: tomorrowStr, endDate: fourDaysLaterStr, quantity: 4 });

        assert.deepStrictEqual(result, { isAvailable: true, availableQty: 5 });
    });
});

// ============================
// describe: updateOrderStatus
// ============================

describe('updateOrderStatus', () => {
    test('Throw 404 when order not found', async () => {
        RentalMock.findById = async () => null;

        await assert.rejects(
            async () => rentalService.updateOrderStatus('507f191e810c19729de860ea', 'delivering'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Successfully update status (non-delivering) → no GHN call', async () => {
        let ghnCalled = false;
        ghnCreateOrderImpl = async () => { ghnCalled = true; return {}; };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('507f191e810c19729de860ea', 'confirmed');

        assert.strictEqual(result.status, 'confirmed');
        assert.ok(result._saved);
        assert.ok(!ghnCalled);
    });

    test('Push to GHN successfully when status is delivering and address exists', async () => {
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => ({ order_code: 'GHN_ORDER_123' });
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('507f191e810c19729de860ea', 'delivering');

        assert.strictEqual(result.trackingCode, 'GHN_ORDER_123');
        assert.strictEqual(result.status, 'delivering');
    });

    test('Ignore GHN errors and continue updating status', async () => {
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => { throw new Error('GHN connection failed'); };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.updateOrderStatus('507f191e810c19729de860ea', 'delivering');

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
            async () => rentalService.confirmPreparation('507f191e810c19729de860ea'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Throw 400 when status is not pending', async () => {
        mockData.rental.status = 'renting';
        RentalMock.findById = async () => mockData.rental;

        await assert.rejects(
            async () => rentalService.confirmPreparation('507f191e810c19729de860ea'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Push to GHN and transition to delivering', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => ({ order_code: 'GHN_ORDER_999' });
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('507f191e810c19729de860ea');

        assert.strictEqual(mockData.rental.trackingCode, 'GHN_ORDER_999');
        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Xác nhận thành công'));
    });

    test('Transition to delivering with error message when GHN fails', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321', addressDetail: 'Duy Tan', wardCode: '200101', districtId: 2001 };
        ghnCreateOrderImpl = async () => { throw new Error('GHN error'); };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('507f191e810c19729de860ea');

        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Lỗi kết nối GHN'));
    });

    test('Transition to delivering directly when shippingAddress has no districtId', async () => {
        mockData.rental.status = 'pending';
        mockData.rental.shippingAddress = { receiverName: 'John', receiverPhone: '0987654321' };
        RentalMock.findById = async () => mockData.rental;

        const result = await rentalService.confirmPreparation('507f191e810c19729de860ea');

        assert.strictEqual(mockData.rental.status, 'delivering');
        assert.ok(result.message.includes('Không tạo đơn GHN'));
    });
});

// ============================
// describe: Dashboard Analytics
// ============================

describe('Dashboard Analytics', () => {
    // getTotalRevenue() tính doanh thu từ totalRentalPrice + shippingFee + phí phát sinh (KHÔNG gồm
    // tiền cọc — cọc là tiền giữ hộ, sẽ hoàn lại nên không phải doanh thu thật), khác totalAmount cũ
    // (gộp cả cọc). Fixture phải khớp field thật sự được đọc, nếu không mọi thứ cộng dồn ra 0.
    test('Get total revenue successfully', async () => {
        RentalMock.find = async (filter) => {
            mockData.rentalFindFilter = filter;
            return [
                { totalRentalPrice: 100000, totalDeposit: 50000, shippingFee: 20000, lateFee: 5000, damageFee: 0, replacementFee: 0, createdAt: new Date('2026-01-15') },
                { totalRentalPrice: 200000, totalDeposit: 80000, shippingFee: 30000, lateFee: 0, damageFee: 10000, replacementFee: 0, createdAt: new Date('2026-01-20') },
            ];
        };

        const result = await rentalService.getTotalRevenue();

        assert.deepStrictEqual(result, {
            totalRevenue: 365000,        // (100000+20000+5000) + (200000+30000+10000)
            totalRentalPrice: 300000,
            totalDeposit: 130000,
            totalDeductedDeposit: 15000, // tổng lateFee+damageFee+replacementFee
            orderCount: 2,
            revenueByMonth: [{ month: '2026-01', total: 365000 }],
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
            async () => rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', null),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Rental not found → throws 404', async () => {
        RentalMock.findOne = (filter) => ({
            populate: async () => null
        });

        await assert.rejects(
            async () => rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Rental is not in renting status → throws 400', async () => {
        mockData.rental.status = 'confirmed';
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('NewEndDate not in the future compared to original endDate → throws 400', async () => {
        mockData.rental.status = 'renting';
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', tomorrowStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Costume in order items not found → throws 404', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = null;
        RentalMock.findOne = (filter) => ({ populate: async () => mockData.rental });

        await assert.rejects(
            async () => rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', newEndDateStr),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    // Đã bỏ test "Overlap with another reservation during extension window" — extendRental() giờ chỉ
    // gọi Rental.findOne() ĐÚNG 1 LẦN (không còn truy vấn lần 2 tìm đơn khác trùng ngày để chặn gia
    // hạn); giới hạn duy nhất còn lại là costume.maxRentalDays, đã có test riêng phía trên.

    test('Payment required → return payload with paymentRequired=true', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = buildMockCostume();
        mockData.rental.items[0].rentalPricePerDay = 100000;

        let callCount = 0;
        RentalMock.findOne = (filter) => {
            callCount++;
            if (callCount === 1) return { populate: async () => mockData.rental };
            return Promise.resolve(null);
        };

        const result = await rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', newEndDateStr);

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.paymentRequired, true);
        assert.ok(mockData.rental._saved);
    });

    test('Successfully extend rental without extra cost (e.g. 0 amount) → success', async () => {
        mockData.rental.status = 'renting';
        mockData.rental.items[0].costume = buildMockCostume();
        mockData.rental.items[0].rentalPricePerDay = 0;

        let callCount = 0;
        RentalMock.findOne = (filter) => {
            callCount++;
            if (callCount === 1) return { populate: async () => mockData.rental };
            return Promise.resolve(null);
        };

        const result = await rentalService.extendRental('507f191e810c19729de860ea', '507f1f77bcf86cd799439011', newEndDateStr);

        assert.ok(mockData.rental._saved);
        assert.strictEqual(result.success, true);
        assert.ok(result.message.includes('Gia hạn thuê'));
    });
});