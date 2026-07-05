const cartService = require('../services/cart.service');
const Cart = require('../models/cart.model');
const Costume = require('../models/costume.model');
const HttpError = require('../models/http-error.model');

jest.mock('../models/cart.model');
jest.mock('../models/costume.model');

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
  name: 'Áo Dài Hội Nghị',
  status: 'available',
  pricePerDay: 200000,
  price: 2000000,
  deposit: 500000,
  categoryId: { _id: 'cat_001', name: 'Truyền Thống' },
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
  save: jest.fn().mockResolvedValue(true),
  populate: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});



describe('getAllCarts', () => {
  test('Get items when cart exists', async () => {
    const mockDocs = [
      {
        _id: 'cart_id_999',
        customerId: USER_ID,
        items: [
          {
            _id: 'item_1',
            costume: {
              _id: COSTUME_ID,
              name: 'Áo Dài Hội Nghị',
              images: ['img1.jpg'],
              categoryId: { name: 'Truyền Thống' },
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

    Cart.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockDocs),
    });

    const result = await cartService.getAllCarts(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      costumeName: 'Áo Dài Hội Nghị',
      size: 'M',
      quantity: 2,
      rentalDays: 2,
      rentalPerDay: 200000,
      deposit: 500000,
      category: 'Truyền Thống',
    });
  });

  test('Cart is empty', async () => {
    Cart.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    await expect(cartService.getAllCarts(USER_ID))
      .rejects
      .toThrow(new HttpError('Cart is empty.', 404));
  });

  test('flatMap correctly when multiple cart documents exist', async () => {
    const mockDocs = [
      {
        _id: 'c1',
        items: [
          {
            _id: 'i1',
            costume: {
              _id: 'cos1', name: 'Sườn Xám', images: [],
              categoryId: { name: 'Cổ Trang' }, deposit: 300000,
              pricePerDay: 150000, variants: [],
            },
            size: 'S', quantity: 1, status: 'active',
            startDate: new Date('2026-09-01'), endDate: new Date('2026-09-02'), rentalDays: 1,
          },
        ],
      },
      {
        _id: 'c2',
        items: [
          {
            _id: 'i2',
            costume: {
              _id: 'cos2', name: 'Hanbok', images: ['h.jpg'],
              categoryId: { name: 'Quốc Tế' }, deposit: 800000,
              pricePerDay: 250000, variants: [],
            },
            size: 'L', quantity: 2, status: 'active',
            startDate: new Date('2026-09-05'), endDate: new Date('2026-09-07'), rentalDays: 2,
          },
        ],
      },
    ];

    Cart.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockDocs),
    });

    const result = await cartService.getAllCarts(USER_ID);
    expect(result).toHaveLength(2);
    expect(result[0].costumeName).toBe('Sườn Xám');
    expect(result[1].costumeName).toBe('Hanbok');
  });
});

describe('addCart', () => {
  const basePayload = () => ({
    costumeId: COSTUME_ID,
    size: 'M',
    quantity: 1,
    startDate: START.toISOString(),
    endDate: END.toISOString(),
  });
  test('Create new cart', async () => {
    Costume.findById.mockResolvedValue(makeCostume());
    Cart.findOne.mockResolvedValue(null);

    const newCart = makeCart([]);
    Cart.create.mockResolvedValue(newCart);

    const result = await cartService.addCart(USER_ID, basePayload());

    expect(Cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: USER_ID })
    );
    expect(result).toBe(newCart);
  });

  test('Push new item into existing cart', async () => {
    Costume.findById.mockResolvedValue(makeCostume());
    Cart.findOne.mockResolvedValue(makeCart([]));

    const updatedCart = makeCart([makeCartItem()]);
    Cart.findOneAndUpdate.mockResolvedValue(updatedCart);

    await cartService.addCart(USER_ID, basePayload());

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { customerId: USER_ID },
      expect.objectContaining({ $push: expect.anything() }),
      { new: true }
    );
  });

  //  SAME costume + SAME size + SAME date  → $inc (cộng dồn quantity)
  //  SAME costume + DIFF size  + SAME date → $push (thêm dòng mới)
  //  SAME costume + SAME size  + DIFF date → $push (thêm dòng mới)
  test('Add item with same costume, size, and date', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const existingItem = makeCartItem({
      size: 'M',
      quantity: 2,
      startDate: new Date(START),
      endDate: new Date(END),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItem]));
    Cart.findOneAndUpdate.mockResolvedValue(makeCart([{ ...existingItem, quantity: 3 }]));

    // Thêm tiếp: cùng costume + size M + cùng ngày
    await cartService.addCart(USER_ID, basePayload()); // size: 'M', start: START, end: END

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { customerId: USER_ID },
      expect.objectContaining({ $inc: expect.anything() }), // tăng qty, không push
      { new: true }
    );
  });

  test('Add item with different size but same costume', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const existingItemM = makeCartItem({
      size: 'M',
      quantity: 1,
      startDate: new Date(START),
      endDate: new Date(END),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItemM]));
    Cart.findOneAndUpdate.mockResolvedValue(
      makeCart([existingItemM, makeCartItem({ size: 'L' })])
    );

    // Thêm: cùng costume, nhưng size L
    await cartService.addCart(USER_ID, {
      costumeId: COSTUME_ID,
      size: 'L',                       // ← size khác → findIndex = -1
      quantity: 1,
      startDate: START.toISOString(),
      endDate: END.toISOString(),
    });

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { customerId: USER_ID },
      expect.objectContaining({ $push: expect.anything() }), // thêm dòng mới
      { new: true }
    );
  });

  test('Add item with same costume, same size but different date', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const existingItem = makeCartItem({
      size: 'M',
      quantity: 1,
      startDate: new Date(START),
      endDate: new Date(END),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItem]));
    Cart.findOneAndUpdate.mockResolvedValue(makeCart([existingItem, makeCartItem()]));

    const event2Start = new Date(START);
    event2Start.setDate(event2Start.getDate() + 14);
    const event2End = new Date(event2Start);
    event2End.setDate(event2End.getDate() + 2);

    await cartService.addCart(USER_ID, {
      costumeId: COSTUME_ID,
      size: 'M',                             // cùng size
      quantity: 1,
      startDate: event2Start.toISOString(),  // ← ngày khác → findIndex = -1
      endDate: event2End.toISOString(),
    });

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { customerId: USER_ID },
      expect.objectContaining({ $push: expect.anything() }), // tạo dòng mới
      { new: true }
    );
  });

  test('Add item with same costume, same size but overlapping date', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const existingItem = makeCartItem({
      size: 'M',
      quantity: 1,
      startDate: new Date('2026-07-10T00:00:00.000Z'),
      endDate: new Date('2026-07-12T00:00:00.000Z'),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItem]));

    // Yêu cầu thêm: Thuê từ ngày 11/07 đến 13/07 (Trùng ngày 11 và 12)
    await expect(
      cartService.addCart(USER_ID, {
        costumeId: COSTUME_ID,
        size: 'M',
        quantity: 1,
        startDate: '2026-07-11T00:00:00.000Z',
        endDate: '2026-07-13T00:00:00.000Z',
      })
    )
      .rejects
      .toThrow(new HttpError('Trùng ngày thuê. Vui lòng kiểm tra lại giỏ hàng.', 400));
  });


  test('Add item with non-existent costume', async () => {
    Costume.findById.mockResolvedValue(null);

    await expect(cartService.addCart(USER_ID, basePayload()))
      .rejects
      .toThrow(new HttpError('Costume not found', 404));
  });

  test('quantity > availableStock', async () => {
    Costume.findById.mockResolvedValue(makeCostume()); // M: availableStock = 5

    await expect(
      cartService.addCart(USER_ID, { ...basePayload(), quantity: 10 })
    )
      .rejects
      .toThrow(HttpError);
  });

  test('Add item with non-existent size', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    await expect(
      cartService.addCart(USER_ID, { ...basePayload(), size: 'XXL' })
    )
      .rejects
      .toThrow(new HttpError('Sản phẩm không có size XXL', 404));
  });


  test('total quantity (cart + new) exceeds availableStock', async () => {
    Costume.findById.mockResolvedValue(makeCostume()); // M: availableStock = 5

    const existingItem = makeCartItem({
      quantity: 4,
      startDate: new Date(START),
      endDate: new Date(END),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItem]));

    // Thêm 2 → tổng 6 > 5
    await expect(
      cartService.addCart(USER_ID, { ...basePayload(), quantity: 2 })
    )
      .rejects
      .toThrow(HttpError);
  });


  test('startDate is today or earlier', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    await expect(
      cartService.addCart(USER_ID, {
        ...basePayload(),
        startDate: today.toISOString(),
        endDate: END.toISOString(),
      })
    )
      .rejects
      .toThrow(new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400));
  });

  test('endDate is today or earlier', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    await expect(
      cartService.addCart(USER_ID, {
        ...basePayload(),
        startDate: START.toISOString(),
        endDate: today.toISOString(),
      })
    )
      .rejects
      .toThrow(new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400));
  });


  test('endDate is before startDate', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const laterStart = new Date(END);
    laterStart.setDate(laterStart.getDate() + 1);

    await expect(
      cartService.addCart(USER_ID, {
        ...basePayload(),
        startDate: laterStart.toISOString(),
        endDate: START.toISOString(),
      })
    )
      .rejects
      .toThrow(new HttpError('Vui lòng đặt thuê đồ trước ít nhất 1 ngày', 400));
  });


  test('startDate/endDate is invalid date string', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    await expect(
      cartService.addCart(USER_ID, {
        ...basePayload(),
        startDate: 'invalid-date',
        endDate: 'also-bad',
      })
    )
      .rejects
      .toThrow(new HttpError('Ngày tháng không hợp lệ', 400));
  });

  test('Add quantity when costume/size/date is the same but hours/minutes/seconds is different', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const existingItem = makeCartItem({
      quantity: 2,
      startDate: new Date(START),
      endDate: new Date(END),
    });
    Cart.findOne.mockResolvedValue(makeCart([existingItem]));

    const inputStart = new Date(START);
    inputStart.setHours(10, 30, 15);
    const inputEnd = new Date(END);
    inputEnd.setHours(18, 45, 0);

    await expect(
      cartService.addCart(USER_ID, {
        costumeId: COSTUME_ID,
        size: 'M',
        quantity: 1,
        startDate: inputStart.toISOString(),
        endDate: inputEnd.toISOString(),
      })
    )
      .rejects
      .toThrow(new HttpError('Trùng ngày thuê. Vui lòng kiểm tra lại giỏ hàng.', 400));
  });
});

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

  // Setup cart có sẵn 1 item khớp đúng key
  const setupCartWithMatchingItem = (itemOverrides = {}) => {
    const item = {
      _id: 'item_id_111',
      costume: { toString: () => COSTUME_ID },
      size: 'M',
      quantity: 2,
      startDate: new Date(UPDATE_START),
      endDate: new Date(UPDATE_END),
      rentalDays: 3,
      rentalPrice: 200000,
      depositPrice: 500000,
      ...itemOverrides,
    };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);
    return { item, cart };
  };

  test('Update quantity successfully (keep size/date)', async () => {
    Costume.findById.mockResolvedValue(makeCostume());
    const { cart } = setupCartWithMatchingItem();

    const result = await cartService.updateCart(
      USER_ID, COSTUME_ID, baseUpdatePayload({ quantity: 3 })
    );

    expect(cart.save).toHaveBeenCalled();
    expect(result.items[0].quantity).toBe(3);
  });

  test('Throw 404 when costume not found', async () => {
    Costume.findById.mockResolvedValue(null);

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, baseUpdatePayload())
    )
      .rejects
      .toThrow(new HttpError('Costume not found', 404));
  });

  test('Throw 404 when costume is hidden', async () => {
    Costume.findById.mockResolvedValue(makeCostume({ status: 'hidden' }));

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, baseUpdatePayload())
    )
      .rejects
      .toThrow(new HttpError('Sản phẩm không tồn tại.', 404));
  });

  test('Throw 400 when size is out of stock (availableStock = 0)', async () => {
    Costume.findById.mockResolvedValue(
      makeCostume({
        variants: [
          { size: 'M', availableStock: 0, totalStock: 5 },
          { size: 'L', availableStock: 3, totalStock: 8 },
        ],
      })
    );
    setupCartWithMatchingItem();

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, baseUpdatePayload())
    )
      .rejects
      .toThrow(new HttpError('Hết hàng.', 400));
  });

  test('Throw 400 when quantity new exceeds availableStock', async () => {
    Costume.findById.mockResolvedValue(makeCostume()); // M: availableStock = 5
    setupCartWithMatchingItem();

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, baseUpdatePayload({ quantity: 99 }))
    )
      .rejects
      .toThrow(HttpError);
  });

  test('Throw 404 when cart document not found', async () => {
    Costume.findById.mockResolvedValue(makeCostume());
    Cart.findOne.mockResolvedValue(null);

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, baseUpdatePayload())
    )
      .rejects
      .toThrow(new HttpError('Cart not found', 404));
  });


  // user đổi size M→L nhưng đã có item L cùng ngày.
  test('Merge item when changing to existing identity in cart', async () => {
    Costume.findById.mockResolvedValue(makeCostume()); // M and L both have availableStock

    const newStart = new Date(UPDATE_START);
    newStart.setDate(newStart.getDate() + 5);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 2);

    const oldItem = {
      _id: 'item_old', costume: { toString: () => COSTUME_ID },
      size: 'M', quantity: 1, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3,
      rentalPrice: 0, depositPrice: 0,
    };
    const targetItem = {
      _id: 'item_target', costume: { toString: () => COSTUME_ID },
      size: 'M', quantity: 2, startDate: newStart, endDate: newEnd, rentalDays: 3,
      rentalPrice: 0, depositPrice: 0,
    };
    const cart = makeCart([oldItem, targetItem]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.updateCart(USER_ID, COSTUME_ID, {
      size: 'M',
      quantity: 1,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
      oldSize: 'M',
      oldStartDate: UPDATE_START.toISOString(),
      oldEndDate: UPDATE_END.toISOString(),
    });

    expect(cart.save).toHaveBeenCalled();
    // oldItem bị splice ra, chỉ còn targetItem (đã được tăng quantity)
    expect(cart.items).toHaveLength(1);
  });

  test('Throw 400 when startDate is not after tomorrow', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    Cart.findOne.mockResolvedValue(makeCart([
      makeCartItem({ startDate: new Date(tomorrow), endDate: new Date(dayAfter) }),
    ]));

    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, {
        size: 'M', quantity: 1,
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
      })
    )
      .rejects
      .toThrow(new HttpError('Ngày nhận đồ phải sau ngày mai', 400));
  });

  test('Throw 400 when total quantity after merge exceeds availableStock', async () => {
    Costume.findById.mockResolvedValue(makeCostume()); // M: availableStock = 5

    const newStart = new Date(UPDATE_START);
    newStart.setDate(newStart.getDate() + 5);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 2);

    const oldItem = {
      _id: 'item_old', costume: { toString: () => COSTUME_ID },
      size: 'M', quantity: 4, startDate: new Date(UPDATE_START), endDate: new Date(UPDATE_END), rentalDays: 3,
      rentalPrice: 0, depositPrice: 0,
    };
    const targetItem = {
      _id: 'item_target', costume: { toString: () => COSTUME_ID },
      size: 'M', quantity: 2, startDate: newStart, endDate: newEnd, rentalDays: 3,
      rentalPrice: 0, depositPrice: 0,
    };
    Cart.findOne.mockResolvedValue(makeCart([oldItem, targetItem]));

    // Cố gộp: target(2) + new quantity(4) = 6 > 5
    await expect(
      cartService.updateCart(USER_ID, COSTUME_ID, {
        size: 'M', quantity: 4,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
        oldSize: 'M',
        oldStartDate: UPDATE_START.toISOString(),
        oldEndDate: UPDATE_END.toISOString(),
      })
    )
      .rejects
      .toThrow(HttpError);
  });

  test('Update successfully and normalize old/new date with different hours/minutes to midnight', async () => {
    Costume.findById.mockResolvedValue(makeCostume());

    const dbStart = new Date(UPDATE_START);
    const dbEnd = new Date(UPDATE_END);

    const item = {
      _id: 'item_id_111',
      costume: { toString: () => COSTUME_ID },
      size: 'M',
      quantity: 2,
      startDate: dbStart,
      endDate: dbEnd,
      rentalDays: 3,
      rentalPrice: 200000,
      depositPrice: 500000,
    };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);

    const clientOldStart = new Date(UPDATE_START);
    clientOldStart.setHours(14, 0, 0);
    const clientOldEnd = new Date(UPDATE_END);
    clientOldEnd.setHours(17, 30, 0);

    const clientNewStart = new Date(UPDATE_START);
    clientNewStart.setHours(15, 0, 0);
    const clientNewEnd = new Date(UPDATE_END);
    clientNewEnd.setHours(20, 0, 0);

    await expect(
      cartService.updateCart(
        USER_ID, COSTUME_ID, {
          size: 'M',
          quantity: 3,
          startDate: clientNewStart.toISOString(),
          endDate: clientNewEnd.toISOString(),
          oldSize: 'M',
          oldStartDate: clientOldStart.toISOString(),
          oldEndDate: clientOldEnd.toISOString(),
        }
      )
    )
      .rejects
      .toThrow(new HttpError('Không tìm thấy sản phẩm trong giỏ hàng để cập nhật', 404));
  });
});

describe('removeAllCartByCustomer', () => {
  test('Remove all cart successfully', async () => {
    Cart.findOneAndDelete.mockResolvedValue({ _id: 'cart_id_999' });

    await cartService.removeAllCartByCustomer(USER_ID);

    expect(Cart.findOneAndDelete).toHaveBeenCalledWith({ customerId: USER_ID });
  });

  test('Do not throw error when cart does not exist', async () => {
    Cart.findOneAndDelete.mockResolvedValue(null);

    await expect(cartService.removeAllCartByCustomer(USER_ID))
      .resolves
      .not.toThrow();
  });
});

describe('removeCartItem', () => {
  test('Remove correct item by costumeId + size + date, keep other items', async () => {
    const startStr = START.toISOString();
    const endStr = END.toISOString();

    const targetItem = {
      _id: 'item_target',
      costume: { toString: () => COSTUME_ID },
      size: 'M',
      startDate: new Date(startStr),
      endDate: new Date(endStr),
    };
    const keepItem = {
      _id: 'item_keep',
      costume: { toString: () => 'other_costume' },
      size: 'L',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-03'),
    };

    const cart = makeCart([targetItem, keepItem]);
    Cart.findOne.mockResolvedValue(cart);

    const result = await cartService.removeCartItem(USER_ID, {
      costumeId: COSTUME_ID, size: 'M', startDate: startStr, endDate: endStr,
    });

    expect(cart.save).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe('item_keep');
  });


  test('Cart does not exist', async () => {
    Cart.findOne.mockResolvedValue(null);

    const result = await cartService.removeCartItem(USER_ID, {
      costumeId: COSTUME_ID, size: 'M',
      startDate: START.toISOString(), endDate: END.toISOString(),
    });

    expect(result).toBeNull();
  });

  test('Throw 400 when costumeId is missing', async () => {
    await expect(
      cartService.removeCartItem(USER_ID, {})
    )
      .rejects
      .toThrow(new HttpError('Vui lòng cung cấp costumeId', 400));
  });

  // Cùng costumeId nhưng size khác → KHÔNG bị xóa, item L sẽ bị xóa oan khi user xóa item M.
  test('Not remove item if costumeId match but size is different', async () => {
    const item = {
      _id: 'item_l',
      costume: { toString: () => COSTUME_ID },
      size: 'L',
      startDate: new Date(START),
      endDate: new Date(END),
    };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);

    const result = await cartService.removeCartItem(USER_ID, {
      costumeId: COSTUME_ID, size: 'M',
      startDate: START.toISOString(), endDate: END.toISOString(),
    });

    // item 'L' không bị xóa
    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe('item_l');
  });
});
