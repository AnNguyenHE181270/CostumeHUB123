const RentalOrder = require('../models/rental-order.model');
const Costume = require('../models/costume.model');
const HttpError = require('../models/http-error.model');

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

// MATSL-05-07: Khách hàng tạo đơn thuê
const createOrder = async (req, res, next) => {
    try {
        const { costumeId, startDate, endDate, quantity } = req.body;
        const userId = req.userData.userId; // Lấy từ check-auth.middleware.js
        
        const costume = await Costume.findById(costumeId);
        
        // Tính tiền: Giá thuê * Số lượng * Số ngày (Giả sử 1 ngày tối thiểu)
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1;
        const rentalFee = costume.price * quantity * days;
        const depositFee = 500000 * quantity; // Mặc định cọc 500k/bộ

        const newOrder = new RentalOrder({
            user: userId, costume: costumeId, startDate, endDate, quantity, rentalFee, depositFee
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        next(new HttpError('Creating order failed', 500));
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

module.exports = { checkAvailability, createOrder, getAllOrders, updateOrderStatus };