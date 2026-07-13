const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');

// ============================
// Helpers
// ============================

const USER_ID = 'user_id_001';
const COSTUME_ID = 'costume_id_abc';

const START = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
})();
const END = new Date(START);
END.setDate(END.getDate() + 2);

const makeCostume = (overrides = {}) => ({
    _id: COSTUME_ID,
    name: 'Ao Dai Hoi Nghi',
    status: 'available',
    pricePerDay: 200000,
    price: 2000000,
    deposit: 500000,
    minRentalDays: 1,
    categoryId: { _id: 'cat_001', name: 'Truyen Thong' },
    images: ['img1.jpg'],
    variants: [
        { size: 'M', availableStock: 5, totalStock: 10 },
        { size: 'L', availableStock: 3, totalStock: 8 },
    ],
    ...overrides,
});

const makeCartItem = (overrides = {}) => ({
    _id: 'item_id_111',
    costume: { toString: () => COSTUME_ID },
    size: 'M',
    quantity: 1,
    status: 'active',
    startDate: new Date(START),
    endDate: new Date(END),
    rentalDays: 2,
    ...overrides,
});

const makeCart = (items = [], overrides = {}) => ({
    _id: 'cart_id_999',
    customerId: USER_ID,
    items,
    save: async function () { this._saved = true; },
    populate: async function () { },
    ...overrides,
});

// ============================
// Mocks
// ============================

let mockData = {};

const CartMock = {
    find: (filter) => {
        mockData.cartFindFilter = filter;
        return {
            populate: function () { return this; },
            lean: async () => mockData.cartDocs || [],
        };
    },
    findOne: async (filter) => {
        mockData.cartFindOneFilter = filter;
        return mockData.cart || null;
    },
    create: async (data) => {
        mockData.cartCreateCalledWith = data;
        return mockData.createdCart || makeCart([]);
    },
    findOneAndUpdate: async (filter, update, opts) => {
        mockData.lastFindOneAndUpdateFilter = filter;
        mockData.lastFindOneAndUpdateUpdate = update;
        return mockData.updatedCart || makeCart([]);
    },
    findOneAndDelete: async (filter) => {
        mockData.deletedFilter = filter;
        return mockData.deletedCart || null;
    },
};

const CostumeMock = {
    findById: async (id) => {
        mockData.costumeFindByIdCalledWith = id;
        return mockData.costume || null;
    },
};

mock('../models/cart.model', CartMock);
mock('../models/costume.model', CostumeMock);

const { getAllCarts, addCart, updateCart, removeAllCartByCustomer, removeCartItem } = require('../services/cart.service');
const HttpError = require('../models/http-error.model');

// ============================
// describe: getAllCarts
// ============================

describe('getAllCarts', () => {
    beforeEach(() => { mockData = {}; });

    test('Get items when cart exists', async () => {
        mockData.cartDocs = [
            {
                _id: 'cart_id_999',
                customerId: USER_ID,
                items: [
                    {
                        _id: 'item_1',
                        costume: {
                            _id: COSTUME_ID,
                            name: 'Ao Dai Hoi Nghi',
                            images: ['img1.jpg'],
                            categoryId: { name: 'Truyen Thong' },
                            deposit: 500000,
                            pricePerDay: 200000,
                            variants: [{ size: 'M' }],
                        },
                        size: 'M',
                        quantity: 2,
                        status: 'active',
                        startDate: new Date('2026-08-01'),
                        endDate: new Date('2026-08-03'),
                        rentalDays: 2,
                    },
                ],
            },
        ];

        const result = await getAllCarts(USER_ID);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].costumeName, 'Ao Dai Hoi Nghi');
        assert.strictEqual(result[0].size, 'M');
        assert.strictEqual(result[0].quantity, 2);
        assert.strictEqual(result[0].rentalDays, 2);
        assert.strictEqual(result[0].rentalPerDay, 200000);
        assert.strictEqual(result[0].deposit, 500000);
        assert.strictEqual(result[0].category, 'Truyen Thong');
    });

    test('Cart is empty → throws 404', async () => {
        mockData.cartDocs = [];

        await assert.rejects(
            async () => getAllCarts(USER_ID),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                assert.strictEqual(err.message, 'Cart is empty.');
                return true;
            }
        );
    });

    test('flatMap correctly when multiple cart documents exist', async () => {
        mockData.cartDocs = [
            {
                _id: 'c1',
                items: [{
                    _id: 'i1',
                    costume: { _id: 'cos1', name: 'Suon Xam', images: [], categoryId: { name: 'Co Trang' }, deposit: 300000, pricePerDay: 150000, variants: [] },
                    size: 'S', quantity: 1, status: 'active',
                    startDate: new Date('2026-09-01'), endDate: new Date('2026-09-02'), rentalDays: 1,
                }],
            },
            {
                _id: 'c2',
                items: [{
                    _id: 'i2',
                    costume: { _id: 'cos2', name: 'Hanbok', images: ['h.jpg'], categoryId: { name: 'Quoc Te' }, deposit: 800000, pricePerDay: 250000, variants: [] },
                    size: 'L', quantity: 2, status: 'active',
                    startDate: new Date('2026-09-05'), endDate: new Date('2026-09-07'), rentalDays: 2,
                }],
            },
        ];

        const result = await getAllCarts(USER_ID);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].costumeName, 'Suon Xam');
        assert.strictEqual(result[1].costumeName, 'Hanbok');
    });
});

// ============================
// describe: addCart
// ============================

describe('addCart', () => {
    const basePayload = () => ({
        costumeId: COSTUME_ID,
        size: 'M',
        quantity: 1,
        startDate: START.toISOString(),
        endDate: END.toISOString(),
    });

    beforeEach(() => {
        mockData = {};
        mockData.costume = makeCostume();
    });

    test('Create new cart when no existing cart', async () => {
        mockData.cart = null;
        mockData.createdCart = makeCart([]);

        const result = await addCart(USER_ID, basePayload());

        assert.ok(mockData.cartCreateCalledWith);
        assert.strictEqual(mockData.cartCreateCalledWith.customerId, USER_ID);
    });

    test('Push new item into existing cart (no matching item)', async () => {
        const cart = makeCart([]);
        mockData.cart = cart;
        mockData.updatedCart = makeCart([makeCartItem()]);

        await addCart(USER_ID, basePayload());

        assert.ok(mockData.lastFindOneAndUpdateUpdate.$push);
    });

    test('Add item with same costume, size, and date → $inc quantity', async () => {
        const existingItem = makeCartItem({ size: 'M', quantity: 2, startDate: new Date(START), endDate: new Date(END) });
        mockData.cart = makeCart([existingItem]);
        mockData.updatedCart = makeCart([{ ...existingItem, quantity: 3 }]);

        await addCart(USER_ID, basePayload());

        assert.ok(mockData.lastFindOneAndUpdateUpdate.$inc);
    });

    test('Add item with different size → $push new item', async () => {
        const existingItemM = makeCartItem({ size: 'M', quantity: 1, startDate: new Date(START), endDate: new Date(END) });
        mockData.cart = makeCart([existingItemM]);
        mockData.updatedCart = makeCart([existingItemM, makeCartItem({ size: 'L' })]);

        await addCart(USER_ID, { costumeId: COSTUME_ID, size: 'L', quantity: 1, startDate: START.toISOString(), endDate: END.toISOString() });

        assert.ok(mockData.lastFindOneAndUpdateUpdate.$push);
    });

    test('Add item with same costume + size but different date → $push new item', async () => {
        const existingItem = makeCartItem({ size: 'M', quantity: 1, startDate: new Date(START), endDate: new Date(END) });
        mockData.cart = makeCart([existingItem]);
        mockData.updatedCart = makeCart([existingItem, makeCartItem()]);

        const event2Start = new Date(START);
        event2Start.setDate(event2Start.getDate() + 14);
        const event2End = new Date(event2Start);
        event2End.setDate(event2End.getDate() + 2);

        await addCart(USER_ID, { costumeId: COSTUME_ID, size: 'M', quantity: 1, startDate: event2Start.toISOString(), endDate: event2End.toISOString() });

        assert.ok(mockData.lastFindOneAndUpdateUpdate.$push);
    });

    test('Overlapping date on same costume+size → updates existing item instead of throwing', async () => {
        const existingItem = makeCartItem({
            size: 'M', quantity: 1,
            startDate: new Date(START),
            endDate: new Date(END),
        });
        mockData.cart = makeCart([existingItem]);

        const newStart = new Date(START);
        newStart.setDate(newStart.getDate() + 1);
        const newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 5);

        await addCart(USER_ID, { costumeId: COSTUME_ID, size: 'M', quantity: 1, startDate: newStart.toISOString(), endDate: newEnd.toISOString() });

        assert.strictEqual(mockData.cart.items.length, 1);
        assert.strictEqual(existingItem.startDate.getTime(), newStart.getTime());
        assert.strictEqual(existingItem.endDate.getTime(), newEnd.getTime());
        assert.ok(mockData.cart._saved);
    });

    test('Costume not found → throws 404', async () => {
        mockData.costume = null;

        await assert.rejects(
            async () => addCart(USER_ID, basePayload()),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                return true;
            }
        );
    });

    test('quantity > availableStock → throws 400', async () => {
        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), quantity: 10 }),
            (err) => {
                assert.ok(err instanceof HttpError);
                return true;
            }
        );
    });

    test('Size not found → throws 404', async () => {
        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), size: 'XXL' }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                assert.ok(err.message.includes('XXL'));
                return true;
            }
        );
    });

    test('Total quantity (cart + new) exceeds availableStock → throws 400', async () => {
        const existingItem = makeCartItem({ quantity: 4, startDate: new Date(START), endDate: new Date(END) });
        mockData.cart = makeCart([existingItem]);

        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), quantity: 2 }),
            (err) => {
                assert.ok(err instanceof HttpError);
                return true;
            }
        );
    });

    test('startDate is today or earlier → throws 400', async () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), startDate: today.toISOString(), endDate: END.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
    });

    test('endDate is today or earlier → throws 400', async () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), startDate: START.toISOString(), endDate: today.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
    });

    test('endDate before startDate → throws 400', async () => {
        const laterStart = new Date(END);
        laterStart.setDate(laterStart.getDate() + 1);

        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), startDate: laterStart.toISOString(), endDate: START.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
    });

    test('Invalid date string → throws 400', async () => {
        await assert.rejects(
            async () => addCart(USER_ID, { ...basePayload(), startDate: 'invalid-date', endDate: 'also-bad' }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.ok(err.message.includes('Ngày tháng không hợp lệ'));
                return true;
            }
        );
    });

    test('Same costume+size+date with different hours → overlapping → updates existing item', async () => {
        const existingItem = makeCartItem({ quantity: 2, startDate: new Date(START), endDate: new Date(END) });
        mockData.cart = makeCart([existingItem]);

        const inputStart = new Date(START);
        inputStart.setHours(10, 30, 15);
        const inputEnd = new Date(END);
        inputEnd.setHours(18, 45, 0);

        await addCart(USER_ID, { costumeId: COSTUME_ID, size: 'M', quantity: 1, startDate: inputStart.toISOString(), endDate: inputEnd.toISOString() });

        assert.strictEqual(mockData.cart.items.length, 1);
        assert.strictEqual(existingItem.quantity, 1);
        assert.strictEqual(existingItem.startDate.getTime(), inputStart.getTime());
        assert.strictEqual(existingItem.endDate.getTime(), inputEnd.getTime());
    });
});

// ============================
// describe: updateCart
// ============================

describe('updateCart', () => {
    const UPDATE_START = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        d.setHours(0, 0, 0, 0);
        return d;
    })();
    const UPDATE_END = new Date(UPDATE_START);
    UPDATE_END.setDate(UPDATE_END.getDate() + 2);

    const baseUpdatePayload = (overrides = {}) => ({
        size: 'M',
        quantity: 1,
        startDate: UPDATE_START.toISOString(),
        endDate: UPDATE_END.toISOString(),
        ...overrides,
    });

    beforeEach(() => {
        mockData = {};
        mockData.costume = makeCostume();
    });

    test('Update quantity successfully (keep size/date)', async () => {
        const item = {
            _id: 'item_id_111',
            costume: { toString: () => COSTUME_ID },
            size: 'M', quantity: 2,
            startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END),
            rentalDays: 3, rentalPrice: 200000, depositPrice: 500000,
        };
        const cart = makeCart([item]);
        mockData.cart = cart;

        const result = await updateCart(USER_ID, COSTUME_ID, baseUpdatePayload({ quantity: 3 }));

        assert.ok(cart._saved);
        assert.strictEqual(result.items[0].quantity, 3);
    });

    test('Throw 404 when costume not found', async () => {
        mockData.costume = null;

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, baseUpdatePayload()),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                assert.strictEqual(err.message, 'Costume not found');
                return true;
            }
        );
    });

    test('Throw 404 when costume is hidden', async () => {
        mockData.costume = makeCostume({ status: 'hidden' });

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, baseUpdatePayload()),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                return true;
            }
        );
    });

    test('Throw 400 when size is out of stock (availableStock = 0)', async () => {
        mockData.costume = makeCostume({
            variants: [
                { size: 'M', availableStock: 0, totalStock: 5 },
                { size: 'L', availableStock: 3, totalStock: 8 },
            ],
        });
        const item = { _id: 'item_id_111', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 2, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        mockData.cart = makeCart([item]);

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, baseUpdatePayload()),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.strictEqual(err.message, 'Hết hàng.');
                return true;
            }
        );
    });

    test('Throw 400 when new quantity exceeds availableStock', async () => {
        const item = { _id: 'item_id_111', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 2, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        mockData.cart = makeCart([item]);

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, baseUpdatePayload({ quantity: 99 })),
            (err) => {
                assert.ok(err instanceof HttpError);
                return true;
            }
        );
    });

    test('Throw 404 when cart not found', async () => {
        mockData.cart = null;

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, baseUpdatePayload()),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                assert.strictEqual(err.message, 'Cart not found');
                return true;
            }
        );
    });

    test('Merge item when changing to existing identity in cart → splice old item', async () => {
        const newStart = new Date(UPDATE_START);
        newStart.setDate(newStart.getDate() + 5);
        const newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 2);

        const oldItem = { _id: 'item_old', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 1, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        const targetItem = { _id: 'item_target', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 2, startDate: newStart, endDate: newEnd, rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        const cart = makeCart([oldItem, targetItem]);
        mockData.cart = cart;

        await updateCart(USER_ID, COSTUME_ID, {
            size: 'M', quantity: 1,
            startDate: newStart.toISOString(), endDate: newEnd.toISOString(),
            oldSize: 'M',
            oldStartDate: UPDATE_START.toISOString(),
            oldEndDate: UPDATE_END.toISOString(),
        });

        assert.ok(cart._saved);
        assert.strictEqual(cart.items.length, 1); // oldItem was spliced
    });

    test('Throw 400 when startDate is today (less than 1 day in advance)', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const item = { _id: 'item_id_111', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 1, startDate: new Date(today), endDate: new Date(dayAfter), rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        mockData.cart = makeCart([item]);

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, { size: 'M', quantity: 1, startDate: today.toISOString(), endDate: dayAfter.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
    });

    test('Throw 400 when total quantity after merge exceeds availableStock', async () => {
        const newStart = new Date(UPDATE_START);
        newStart.setDate(newStart.getDate() + 5);
        const newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 2);

        const oldItem = { _id: 'item_old', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 4, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        const targetItem = { _id: 'item_target', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 2, startDate: newStart, endDate: newEnd, rentalDays: 3, rentalPrice: 0, depositPrice: 0 };
        mockData.cart = makeCart([oldItem, targetItem]);

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, { size: 'M', quantity: 4, startDate: newStart.toISOString(), endDate: newEnd.toISOString(), oldSize: 'M', oldStartDate: UPDATE_START.toISOString(), oldEndDate: UPDATE_END.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                return true;
            }
        );
    });

    test('Throw 404 when item not found in cart (normalized old dates do not match)', async () => {
        const dbStart = new Date(UPDATE_START);
        const dbEnd = new Date(UPDATE_END);

        const item = { _id: 'item_id_111', costume: { toString: () => COSTUME_ID }, size: 'M', quantity: 2, startDate: dbStart, endDate: dbEnd, rentalDays: 3, rentalPrice: 200000, depositPrice: 500000 };
        mockData.cart = makeCart([item]);

        const clientOldStart = new Date(UPDATE_START);
        clientOldStart.setHours(14, 0, 0);
        const clientOldEnd = new Date(UPDATE_END);
        clientOldEnd.setHours(17, 30, 0);
        const clientNewStart = new Date(UPDATE_START);
        clientNewStart.setHours(15, 0, 0);
        const clientNewEnd = new Date(UPDATE_END);
        clientNewEnd.setHours(20, 0, 0);

        await assert.rejects(
            async () => updateCart(USER_ID, COSTUME_ID, { size: 'M', quantity: 3, startDate: clientNewStart.toISOString(), endDate: clientNewEnd.toISOString(), oldSize: 'M', oldStartDate: clientOldStart.toISOString(), oldEndDate: clientOldEnd.toISOString() }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 404);
                return true;
            }
        );
    });
});

// ============================
// describe: removeAllCartByCustomer
// ============================

describe('removeAllCartByCustomer', () => {
    beforeEach(() => { mockData = {}; });

    test('Remove all cart successfully', async () => {
        mockData.deletedCart = { _id: 'cart_id_999' };

        await removeAllCartByCustomer(USER_ID);

        assert.deepStrictEqual(mockData.deletedFilter, { customerId: USER_ID });
    });

    test('Does not throw when cart does not exist', async () => {
        mockData.deletedCart = null;

        await assert.doesNotReject(async () => removeAllCartByCustomer(USER_ID));
    });
});

// ============================
// describe: removeCartItem
// ============================

describe('removeCartItem', () => {
    beforeEach(() => { mockData = {}; });

    test('Remove correct item by costumeId + size + date, keep other items', async () => {
        const startStr = START.toISOString();
        const endStr = END.toISOString();

        const targetItem = { _id: 'item_target', costume: { toString: () => COSTUME_ID }, size: 'M', startDate: new Date(startStr), endDate: new Date(endStr) };
        const keepItem = { _id: 'item_keep', costume: { toString: () => 'other_costume' }, size: 'L', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-03') };

        const cart = makeCart([targetItem, keepItem]);
        mockData.cart = cart;

        const result = await removeCartItem(USER_ID, { costumeId: COSTUME_ID, size: 'M', startDate: startStr, endDate: endStr });

        assert.ok(cart._saved);
        assert.strictEqual(result.items.length, 1);
        assert.strictEqual(result.items[0]._id, 'item_keep');
    });

    test('Cart does not exist → return null', async () => {
        mockData.cart = null;

        const result = await removeCartItem(USER_ID, { costumeId: COSTUME_ID, size: 'M', startDate: START.toISOString(), endDate: END.toISOString() });

        assert.strictEqual(result, null);
    });

    test('Throw 400 when costumeId is missing', async () => {
        await assert.rejects(
            async () => removeCartItem(USER_ID, {}),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.ok(err.message.includes('costumeId'));
                return true;
            }
        );
    });

    test('Do not remove item if costumeId matches but size is different', async () => {
        const item = { _id: 'item_l', costume: { toString: () => COSTUME_ID }, size: 'L', startDate: new Date(START), endDate: new Date(END) };
        const cart = makeCart([item]);
        mockData.cart = cart;

        const result = await removeCartItem(USER_ID, { costumeId: COSTUME_ID, size: 'M', startDate: START.toISOString(), endDate: END.toISOString() });

        assert.strictEqual(result.items.length, 1);
        assert.strictEqual(result.items[0]._id, 'item_l');
    });
});
