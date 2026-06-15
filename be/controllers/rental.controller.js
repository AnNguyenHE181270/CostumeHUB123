const RentalOrder = require('../models/rental-order.model');
const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model')
const HttpError = require('../models/http-error.model');
const Cart = require('../models/cart.model');
const sendEmail = require('../services/email.service');
const ghnService = require('../services/ghn.service');
const mongoose = require('mongoose');

//==========================================================================
// danh sách đơn thuê (customer)
const getRentalHistory = async (req, res, next) => {
    try {
        const userId = req.userData.id;

        const orders = await Rental.find({ customerId: userId })
            .populate("items.costume", "name images rentalRates")
            .sort({ createdAt: -1 });

        const result = orders.map(order => ({
            id: order._id,
            costumeName: order.items[0]?.costume?.name || "Đơn hàng thuê",
            costumeImage: order.items[0]?.costume?.images?.[0] || "",
            rentalPeriod: `${Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24))} ngày`,
            startDate: new Date(order.startDate).toLocaleDateString('vi-VN'),
            endDate: new Date(order.endDate).toLocaleDateString('vi-VN'),
            status: order.status,
            totalPrice: order.totalAmount,
            address: order.shippingAddress.addressDetail,
            items: order.items.map(item => ({
                costumeName: item.costume?.name || "Sản phẩm",
                image: item.costume?.images?.[0] || "",
                size: item.size,
                quantity: item.quantity,
                rentalPerDay: item.rentalPricePerDay || item.costume?.rentalRates?.pricePerDay || 0
            }))
        }));

        res.status(200).json(result);
    } catch (error) {
        next(new HttpError(error.message || 'Fetching orders failed', 500));
    }
}

const orderDetail = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const customerId = req.userData.id;
        const order = await Rental.findOne({ _id: orderId, customerId: customerId })
            .populate("customerId", "fullName phone email")
            .populate("items.costume", "name images price rentalRates")
        if (!order) {
            return res.status(404).json({ message: "Orders not found." })
        }
        res.status(200).json({
            orderId,
            customer: {
                name: order.customerId.fullName,
                phone: order.customerId.phone,
                email: order.customerId.email
            },
            payment: {
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                rental: order.totalRentalPrice,
                deposit: order.totalDeposit,
                shipping: order.shippingFee,
                total: order.totalAmount
            },
            notes: order.shippingAddress.note,
            orderDate: order.createdAt,
            rentalPeriod: Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24)) + 1,
            items: order.items.map(item => ({
                costumeName: item.costume.name,
                image: item.costume.images[0],
                size: item.size,
                quantity: item.quantity,
                price: item.costume.price,
                rentalPerDay: item.rentalPricePerDay || item.costume?.rentalRates?.pricePerDay || 0
            })),
        })
    } catch (error) {
        next(new HttpError(error.message || 'Fetching order detail failed', 500));
    }
}

// Khách hàng tạo đơn thuê
// case Khách đặt trùng lịch của cùng một chiếc váy trong cùng một ngày.
const createOrder = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const { startDate, endDate, items, shippingFee, shippingAddress, paymentMethod } = req.body;

        // Tính số ngày thuê
        const start = new Date(startDate);
        const end = new Date(endDate);
        const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        let totalRentalPrice = 0;
        let totalDeposit = 0;
        const formattedItems = [];
        const costumesToUpdate = [];

        // BƯỚC 1: Kiểm tra tồn kho của TẤT CẢ sản phẩm trước khi trừ
        for (const item of items) {
            const costume = await Costume.findById(item.costume);
            // check costume exist
            if (!costume) {
                next(new HttpError("Costume not found.", 404));
            }
            // check khách đặt trùng lịch của cùng một chiếc váy trong cùng một ngày.

            const existingOrder = await Rental.findOne({
                "items.costume": item.costume,
                "items.size": item.size,
                status: { $in: ['pending', 'confirmed', 'delivering', 'renting'] },
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) },
            })
            if (existingOrder) {
                return next(new HttpError(`Sản phẩm đã được đặt trong vài giờ qua. Vui lòng kiểm tra đơn hàng.`, 400));
            }
            // Tìm đúng variant có size khách hàng đang đặt
            const variant = costume.variants.find(v => v.size === item.size);

            if (!variant) {
                next(new HttpError(`Sản phẩm ${costume.name} không có size ${item.size}.`, 404));
            }

            // check so luong costume con (=size)
            if (item.quantity > variant.availableStock) {
                next(new HttpError(`Sản phẩm ${costume.name} (Size ${item.size}) không đủ số lượng. Kho chỉ còn ${variant.availableStock}.`, 400));
            }

            // ===== TÍNH GIÁ TIỀN =====

            const depositPrice = costume.deposit || costume.price || 0;
            // Cộng dồn vào tổng đơn
            totalRentalPrice += costume.pricePerDay * item.quantity * rentalDays;
            totalDeposit += depositPrice * item.quantity;

            formattedItems.push({
                costume: costume._id,
                size: item.size,
                quantity: item.quantity,
                rentalPricePerDay: costume.pricePerDay / rentalDays,
                depositPrice: depositPrice
            });

            // Lưu tạm các thay đổi sẽ thực hiện
            costumesToUpdate.push({
                costume,
                variant,
                quantityToDeduct: item.quantity
            });
        }

        // BƯỚC 2: Nếu tất cả sản phẩm đều hợp lệ, tiến hành trừ kho
        for (const update of costumesToUpdate) {
            update.variant.availableStock -= update.quantityToDeduct;
            await update.costume.save();
        }

        const totalAmount = totalRentalPrice + totalDeposit + shippingFee;

        const user = await User.findById(customerId);
        if (!user) return next(new HttpError("Người dùng không tồn tại", 404));

        if (user.balance < totalAmount) {
            return next(new HttpError("Số dư ví không đủ. Vui lòng nạp thêm tiền.", 400));
        }

        // Trừ tiền trong ví
        user.balance -= totalAmount;
        await user.save();

        const newOrder = new Rental({
            customerId,
            items: formattedItems,
            startDate,
            endDate,
            shippingFee,
            paymentMethod: "WALLET",
            paymentStatus: "paid",
            shippingAddress,
            totalRentalPrice,
            totalDeposit,
            totalAmount,
            status: "pending"
        });

        await newOrder.save();

        // BƯỚC 3: Tự động dọn dẹp các sản phẩm đã đặt khỏi Giỏ hàng (Cart)
        try {
            const cart = await Cart.findOne({ customerId });
            if (cart) {
                const orderStart = new Date(startDate).getTime();
                const orderEnd = new Date(endDate).getTime();

                // Lọc bỏ những item có trong danh sách vừa đặt
                cart.items = cart.items.filter(cartItem => {
                    const isOrdered = items.some(orderItem =>
                        orderItem.costume.toString() === cartItem.costume.toString() &&
                        orderItem.size === cartItem.size &&
                        new Date(cartItem.startDate).getTime() === orderStart &&
                        new Date(cartItem.endDate).getTime() === orderEnd
                    );
                    return !isOrdered; // Giữ lại những item CHƯA được order
                });

                if (cart.items.length === 0) {
                    await Cart.findOneAndDelete({ customerId });
                } else {
                    await cart.save();
                }
            }
        } catch (cartError) {
            console.error("[Cart Cleanup Error] Lỗi khi dọn dẹp giỏ hàng sau khi đặt:", cartError);
        }

        res.status(201).json({ message: "Đặt hàng và thanh toán thành công", order: newOrder });
    } catch (error) {
        next(new HttpError(error.message || 'Creating order failed', 500));
    }
};

const cancellOrrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;
        const customerId = req.userData.id;

        // 1. check đơn đó tồn tại không
        const order = await Rental.findOne({ _id: id, customerId });
        if (!order) {
            return next(new HttpError('Không tìm thấy đơn hàng.', 404));
        }

        if (!['pending'].includes(order.status)) {
            return next(new HttpError('Không thể hủy đơn hàng ở trạng thái này.', 400));
        }

        // 2. cancell success + add lí do
        order.status = 'cancelled';
        order.cancelReason = cancelReason || 'Người dùng hủy đơn';
        order.paymentStatus = 'refunded';
        await order.save();

        // Hoàn tiền vào ví cho user
        const user = await User.findById(customerId);
        if (user) {
            user.balance = (user.balance || 0) + order.totalAmount;
            await user.save();
        }

        // 3. update lại availableStock cho costume
        for (const item of order.items) {
            const costume = await Costume.findById(item.costume);
            if (costume) {
                const variant = costume.variants.find(v => v.size === item.size);
                if (variant) {
                    variant.availableStock += item.quantity;
                    await costume.save();
                }
            }
        }

        // 4. send mail
        try {
            const user = await User.findById(customerId);
            if (user && user.email) {
                await sendEmail({
                    to: user.email,
                    subject: "CostumeHUB — Thông báo hủy đơn hàng",
                    text: `Chào ${user.fullName},\n\nĐơn hàng ${order._id} của bạn đã bị hủy.\nLý do: ${order.cancelReason}\n\nCảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi.`,
                    html: `
                        <p>Chào <b>${user.fullName}</b>,</p>
                        <p>Đơn hàng <b>${order._id}</b> của bạn đã bị hủy.</p>
                        <p>Lý do: <span style="color: red;">${order.cancelReason}</span></p>
                        <p>Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi.</p>
                    `
                });
            }
        } catch (mailError) {
            console.error("Lỗi khi gửi email hủy đơn: ", mailError);
        }

        res.status(200).json({ message: 'Hủy đơn hàng thành công', order });
    } catch (error) {
        next(new HttpError(error.message || 'Cancel order failed', 500));
    }
}

//==========================================================================



// MATSL-05-06: Hàm kiểm tra lịch trống (có tính thời gian đệm giặt ủi)
const checkAvailability = async (req, res, next) => {
    try {
        const { costumeId, startDate, endDate, quantity } = req.body;
        const costume = await Costume.findById(costumeId);
        if (!costume) return next(new HttpError('Costume not found', 404));

        // Thêm 1 ngày đệm (24h) để giặt ủi sau khi khách trước trả đồ
        const paddingMs = 24 * 60 * 60 * 1000;
        const paddedStartDate = new Date(new Date(startDate).getTime() - paddingMs);
        const paddedEndDate = new Date(new Date(endDate).getTime() + paddingMs);

        // Tìm các đơn đang giữ đồ đè lên khoảng thời gian này
        const overlaps = await Rental.find({
            costume: costumeId,
            status: { $in: ['pending', 'confirmed', 'picked_up'] }, // Không tính đơn đã trả/hủy
            startDate: { $lte: paddedEndDate },
            endDate: { $gte: paddedStartDate }
        });

        const rentedQty = overlaps.reduce((sum, order) => sum + order.quantity, 0);
        const totalStock = costume.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
        const availableQty = totalStock - rentedQty;

        res.status(200).json({
            isAvailable: availableQty >= quantity,
            availableQty
        });
    } catch (error) {
        next(new HttpError('Checking availability failed', 500));
    }
};


// MATSL-04-08: Lấy danh sách đơn (Cho Staff/Owner)
const getAllOrders = async (req, res, next) => {
    try {
        // CHỐT CHẶN QUAN TRỌNG: Ép Backend phải đọc từ bảng Rental mới!
        const orders = await Rental.find()
            .populate('customerId', 'fullName email phone')
            .populate('items.costume', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json(orders);
    } catch (error) {
        next(new HttpError('Fetching orders failed', 500));
    }
};

// MATSL-04-08 & 04-07: Cập nhật trạng thái đơn (Giám sát)
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Rental.findById(id);
        if (!order) return next(new HttpError('Order not found', 404));

        // Nếu chuyển sang Đang giao hàng và chưa có mã vận đơn
        if (status === 'delivering' && !order.trackingCode && order.shippingAddress && order.shippingAddress.districtId) {
            try {
                const ghnOrderData = {
                    payment_type_id: 1,
                    note: "Cho xem hàng, không thử",
                    required_note: "CHOXEMHANGKHONGTHU",
                    to_name: order.shippingAddress.receiverName,
                    to_phone: order.shippingAddress.receiverPhone,
                    to_address: order.shippingAddress.addressDetail || "Không có địa chỉ chi tiết",
                    to_ward_code: order.shippingAddress.wardCode,
                    to_district_id: order.shippingAddress.districtId,
                    weight: 500, // Tạm mặc định 500g
                    length: 20, width: 20, height: 10,
                    service_type_id: 2, // Giao hàng chuẩn
                    items: [{ name: "Trang phục thuê", quantity: 1, weight: 500 }]
                };
                
                const ghnRes = await ghnService.createOrder(ghnOrderData);
                order.trackingCode = ghnRes.order_code;
            } catch (ghnError) {
                console.error("Failed to push to GHN:", ghnError);
                // Vẫn cho phép cập nhật trạng thái nhưng không có trackingCode
            }
        }

        order.status = status;
        await order.save();
        
        res.status(200).json({ message: 'Status updated', order });
    } catch (error) {
        next(new HttpError('Updating status failed', 500));
    }
};

// Staff ấn Confirm sau khi chuẩn bị đồ xong -> Chuyển sang delivering và tạo đơn GHN
const confirmPreparation = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const order = await Rental.findById(id);
        if (!order) return next(new HttpError('Không tìm thấy đơn hàng', 404));

        if (order.status !== 'preparing' && order.status !== 'pending') {
            return next(new HttpError('Đơn hàng chưa ở trạng thái Chờ xử lý hoặc Đang chuẩn bị đồ', 400));
        }

        if (!order.trackingCode && order.shippingAddress && order.shippingAddress.districtId) {
            try {
                const ghnOrderData = {
                    payment_type_id: 1, // 1: Người bán trả phí ship
                    note: "Cho xem hàng, không thử",
                    required_note: "CHOXEMHANGKHONGTHU",
                    to_name: order.shippingAddress.receiverName,
                    to_phone: order.shippingAddress.receiverPhone,
                    to_address: order.shippingAddress.addressDetail || "Không có địa chỉ chi tiết",
                    to_ward_code: order.shippingAddress.wardCode,
                    to_district_id: order.shippingAddress.districtId,
                    weight: 500, // Tạm mặc định 500g
                    length: 20, width: 20, height: 10,
                    service_type_id: 2,
                    items: [{ name: "Trang phục thuê", quantity: 1, weight: 500 }]
                };
                
                const ghnRes = await ghnService.createOrder(ghnOrderData);
                order.trackingCode = ghnRes.order_code;
                order.status = 'delivering';
                await order.save();

                return res.status(200).json({ 
                    message: 'Xác nhận thành công. Đã tạo đơn trên GHN.', 
                    order 
                });
            } catch (ghnError) {
                console.error("Failed to push to GHN:", ghnError);
                // Vẫn cho phép cập nhật trạng thái nhưng không có trackingCode
                order.status = 'delivering';
                await order.save();
                return res.status(200).json({ 
                    message: 'Đã chuyển sang đang giao (Lỗi kết nối GHN nên không tạo được vận đơn).', 
                    order 
                });
            }
        } else {
            // Đơn pick up tại cửa hàng hoặc thiếu địa chỉ thì chỉ chuyển status
            order.status = 'delivering';
            await order.save();
            return res.status(200).json({ 
                message: 'Đã chuyển trạng thái sang đang giao (Không tạo đơn GHN).', 
                order 
            });
        }
    } catch (error) {
        next(new HttpError('Lỗi server khi xác nhận chuẩn bị đồ', 500));
    }
};


// MATSL-xxx: Lấy tổng doanh thu (Total Revenue) cho Dashboard
const getTotalRevenue = async (req, res, next) => {
    try {
        // Thường doanh thu sẽ tính trên các đơn không bị hủy
        const validStatuses = ["confirmed", "delivering", "renting", "returning", "completed", "overdue"];
        
        const orders = await Rental.find({ status: { $in: validStatuses } });
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        res.status(200).json({ totalRevenue });
    } catch (error) {
        next(new HttpError('Fetching total revenue failed', 500));
    }
};

// MATSL-xxx: Lấy số lượng đơn/trang phục đang được thuê (Active Rentals) cho Dashboard
const getActiveRentals = async (req, res, next) => {
    try {
        // Trạng thái "đang ở ngoài" thường là: delivering, renting, overdue
        const activeStatuses = ["delivering", "renting", "overdue"];
        
        const activeOrders = await Rental.find({ status: { $in: activeStatuses } });
        
        // Đếm tổng số lượng trang phục đang ở ngoài
        let totalActiveCostumes = 0;
        activeOrders.forEach(order => {
            order.items.forEach(item => {
                totalActiveCostumes += item.quantity;
            });
        });

        res.status(200).json({ 
            activeOrdersCount: activeOrders.length,
            totalActiveCostumes 
        });
    } catch (error) {
        next(new HttpError('Fetching active rentals failed', 500));
    }
};

// MATSL-xxx: Tỷ lệ khai thác kho (Inventory Utilization) cho Dashboard
const getInventoryUtilization = async (req, res, next) => {
    try {
        // 1. Tính tổng số lượng trang phục hiện có trong kho (tổng của tất cả các size/variant)
        const costumes = await Costume.find();
        let totalStock = 0;
        costumes.forEach(costume => {
            costume.variants.forEach(variant => {
                totalStock += (variant.totalStock || 0);
            });
        });

        if (totalStock === 0) {
            return res.status(200).json({ utilizationPercentage: 0, totalStock: 0, currentlyRented: 0 });
        }

        // 2. Tính tổng số trang phục đang được thuê (đang ở ngoài)
        const activeStatuses = ["delivering", "renting", "overdue"];
        const activeOrders = await Rental.find({ status: { $in: activeStatuses } });
        
        let currentlyRented = 0;
        activeOrders.forEach(order => {
            order.items.forEach(item => {
                currentlyRented += item.quantity;
            });
        });

        // 3. Tính tỷ lệ %
        const utilizationPercentage = ((currentlyRented / totalStock) * 100).toFixed(2);

        res.status(200).json({ 
            utilizationPercentage: parseFloat(utilizationPercentage), 
            totalStock, 
            currentlyRented 
        });
    } catch (error) {
        next(new HttpError('Fetching inventory utilization failed', 500));
    }
};

// KAN-124: Nhận lại đồ từ khách (Chỉ đổi trạng thái sang chờ kiểm tra)
const handleReturn = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    }
    
    if (rental.status !== 'renting') {
      return res.status(400).json({ message: "Đơn hàng phải ở trạng thái Đang thuê" });
    }

    rental.status = 'returning'; // Chuyển sang chờ kiểm tra
    await rental.save();

    return res.status(200).json({ message: "Đã nhận đồ từ khách. Vui lòng tiến hành kiểm tra hao mòn.", data: rental });
  } catch (error) {
    console.error("Lỗi nhận đồ:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi nhận đồ" });
  }
};

// KAN-125: Kiểm tra hao mòn, khấu trừ cọc và đưa đồ đi giặt
const inspectReturn = async (req, res) => {
  const { id } = req.params;
  const { damageFee, missingNotes, actualReturnDate } = req.body; 

  try {
    const rental = await Rental.findById(id).populate('items.costume');
    if (!rental) return res.status(404).json({ message: "Không tìm thấy đơn thuê" });
    if (rental.status !== 'returning') return res.status(400).json({ message: "Đơn chưa được nhận lại để kiểm tra" });

    // 1. Tính toán phạt quá hạn
    const scheduledReturn = new Date(rental.endDate);
    const actualReturn = actualReturnDate ? new Date(actualReturnDate) : new Date();
    
    let daysLate = 0;
    let totalLateFee = 0;

    if (actualReturn > scheduledReturn) {
      const timeDiff = actualReturn.getTime() - scheduledReturn.getTime();
      daysLate = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      rental.items.forEach(item => {
        const feePerDay = item.costume.lateFeePerDay || 50000;
        totalLateFee += daysLate * feePerDay * item.quantity;
      });
    }

    // 2. Tổng hợp phí phạt và khấu trừ cọc
    const finalDamageFee = Number(damageFee) || 0;
    const totalFine = totalLateFee + finalDamageFee;
    const originalDeposit = rental.depositAmount || 0;
    
    let refundAmount = originalDeposit - totalFine;
    if (refundAmount < 0) refundAmount = 0;

    // 3. Cập nhật đơn hàng thành Hoàn tất
    rental.status = 'completed';
    rental.actualReturnDate = actualReturn;
    rental.fineAmount = totalFine;
    rental.refundAmount = refundAmount;
    rental.returnNotes = missingNotes || "Đồ nguyên vẹn";
    await rental.save();

    // 4. Khóa lịch đồ 48h (Dry Cleaning)
    const CostumeModel = mongoose.model('Costume'); 
    const bufferTimeRelease = new Date(actualReturn.getTime() + (48 * 60 * 60 * 1000));

    for (const item of rental.items) {
      await CostumeModel.findByIdAndUpdate(item.costume._id, {
        status: 'dry_cleaning',
        dryCleaningUntil: bufferTimeRelease
      });
    }

    return res.status(200).json({
      message: "Kiểm tra và khấu trừ cọc thành công",
      data: { totalFine, refundAmount, dryCleaningUntil: bufferTimeRelease }
    });

  } catch (error) {
    console.error("Lỗi kiểm tra đồ:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra đồ" });
  }
};

module.exports = { 
    checkAvailability, 
    createOrder, 
    getAllOrders, 
    updateOrderStatus, 
    confirmPreparation,
    getRentalHistory, 
    orderDetail, 
    cancellOrrder,
    getTotalRevenue,
    getActiveRentals,
    getInventoryUtilization,
    handleReturn, 
    inspectReturn
};