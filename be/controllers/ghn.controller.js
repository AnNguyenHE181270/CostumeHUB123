const ghnService = require('../services/ghn.service');
const HttpError = require('../models/http-error.model');
const Rental = require('../models/rental.model');

const getProvinces = async (req, res, next) => {
    try {
        const provinces = await ghnService.getProvinces();
        res.status(200).json(provinces);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

const getDistricts = async (req, res, next) => {
    try {
        const { provinceId } = req.query;
        if (!provinceId) return next(new HttpError("Thiếu provinceId", 400));
        const districts = await ghnService.getDistricts(parseInt(provinceId));
        res.status(200).json(districts);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

const getWards = async (req, res, next) => {
    try {
        const { districtId } = req.query;
        if (!districtId) return next(new HttpError("Thiếu districtId", 400));
        const wards = await ghnService.getWards(parseInt(districtId));
        res.status(200).json(wards);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

const handleWebhook = async (req, res, next) => {
    try {
        const { OrderCode, Status } = req.body;

        // Bỏ qua nếu thiếu dữ liệu
        if (!OrderCode || !Status) {
            return res.status(400).json({ message: "Thiếu dữ liệu OrderCode hoặc Status" });
        }

        // Tìm đơn hàng theo mã vận đơn
        const rentalOrder = await Rental.findOne({ trackingCode: OrderCode });

        if (!rentalOrder) {
            // Vẫn trả về 200 để báo cho GHN là đã nhận nhưng không làm gì cả
            return res.status(200).json({ message: "Không tìm thấy đơn hàng trong hệ thống" });
        }

        // GHN giao hàng thành công -> chuyển sang 'delivered', chờ khách xác nhận
        // (hoặc tự động chuyển sang 'renting' sau 5 tiếng, xem autoUpdateDeliveredStatus)
        if (Status === "delivered" && rentalOrder.status === "delivering") {
            rentalOrder.status = "delivered";
            rentalOrder.deliveredAt = new Date();
            await rentalOrder.save();
            console.log(`[Webhook] Đơn hàng ${rentalOrder._id} đã được cập nhật sang delivered`);
        }
        
        // Luôn trả về 200 OK cho Webhook
        return res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

module.exports = {
    getProvinces,
    getDistricts,
    getWards,
    handleWebhook
};
