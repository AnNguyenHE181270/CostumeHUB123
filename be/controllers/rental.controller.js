const RentalOrder = require('../models/rental-order.model');
const Rental = require('../models/rental.model');
const Costume = require('../models/costume.model');
const User = require('../models/user.model')
const HttpError = require('../models/http-error.model');


//==========================================================================
// danh sách đơn thuê (customer)
const getRentalHistory = async (req, res, next) => {
    try {
        const userId = req.userData.id;

        const orders = await Rental.find({ customerId: userId })
            .populate("items.costume", "name images")
            .sort({ createdAt: -1 });

        const result = orders.map(order => ({
            id: order._id,
            productName: order.items[0]?.costume?.name || "Đơn hàng thuê",
            productImage: order.items[0]?.costume?.images?.[0] || "",
            rentalPeriod: `${Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24)) || 1} ngày`,
            startDate: new Date(order.startDate).toLocaleDateString('vi-VN'),
            endDate: new Date(order.endDate).toLocaleDateString('vi-VN'),
            status: order.status,
            totalPrice: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalAmount),
            address: `${order.shippingAddress.addressDetail}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`
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
            .populate("items.costume", "name images")
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
            rentalPeriod: Math.ceil((order.endDate - order.startDate) / (1000 * 60 * 60 * 24)) || 1,
            items: order.items.map(item => ({
                costumeName: item.costume.name,
                image: item.costume.images[0],
                size: item.size,
                quantity: item.quantity,
            })),
        })
    } catch (error) {
        next(new HttpError(error.message || 'Fetching order detail failed', 500));
    }
}

// Khách hàng tạo đơn thuê
const createOrder = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const { startDate, endDate, items, shippingFee, shippingAddress, paymentMethod } = req.body;

        // Tính số ngày thuê
        const start = new Date(startDate);
        const end = new Date(endDate);
        const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

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

            // totalDepsit += costume.price x quantity
            // totalRental += rentalPerDay x quantity x totalDay
            const depositPrice = costume.price || 0;
            const rentalPricePerDay = costume.rentalPerDay || 0;

            // Cộng dồn vào tổng đơn
            totalRentalPrice += rentalPricePerDay * item.quantity * rentalDays;
            totalDeposit += depositPrice * item.quantity;

            formattedItems.push({
                costume: costume._id,
                size: item.size,
                quantity: item.quantity,
                rentalPricePerDay: rentalPricePerDay,
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

        const totalAmount = totalRentalPrice + totalDeposit + (shippingFee || 0);

        const newOrder = new Rental({
            customerId,
            items: formattedItems,
            startDate,
            endDate,
            shippingFee,
            paymentMethod: paymentMethod || "VietQR",
            shippingAddress,
            totalRentalPrice,
            totalDeposit,
            totalAmount,
            status: "pending"
        });

        await newOrder.save();

        res.status(201).json({ message: "Đặt hàng thành công", order: newOrder });

        // sau 15p, chưa payment -> status Cancelled
    } catch (error) {
        next(new HttpError(error.message || 'Creating order failed', 500));
    }
};

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
        const overlaps = await RentalOrder.find({
            costume: costumeId,
            status: { $in: ['pending', 'confirmed', 'picked_up'] }, // Không tính đơn đã trả/hủy
            startDate: { $lte: paddedEndDate },
            endDate: { $gte: paddedStartDate }
        });

        const rentedQty = overlaps.reduce((sum, order) => sum + order.quantity, 0);
        const availableQty = costume.stock - rentedQty; // Giả sử model Costume dùng trường 'stock'

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
        const orders = await RentalOrder.find().populate('user', 'fullName email').populate('costume', 'name');
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
        const order = await RentalOrder.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json({ message: 'Status updated', order });
    } catch (error) {
        next(new HttpError('Updating status failed', 500));
    }
};


module.exports = { checkAvailability, createOrder, getAllOrders, updateOrderStatus, getRentalHistory, orderDetail };
