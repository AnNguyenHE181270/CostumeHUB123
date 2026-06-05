const Cart = require("../models/cart.model");
const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCarts = async (req, res, next) => {
    try {
        const userId = req.userData.id;
        const carts = await Cart.find({ customerId: userId })
            .populate({
                path: "items.costume",
                select: "name categoryId",
                populate: {
                    path: "categoryId",
                    select: "name"
                }
            }).lean();
        if (carts.length === 0) {
            return next(new HttpError("Cart is empty.", 404));
        }
        const result = carts.flatMap(cart => cart.items.map(item => ({
            _id: item._id,
            costumeId: item.costume._id,
            costumeName: item.costume.name,
            category: item.costume.categoryId.name,
            size: item.size,
            quantity: item.quantity,
            status: item.status,
            startDate: item.startDate,
            endDate: item.endDate,
            rentalPrice: item.rentalPrice,
            rentalDays: item.rentalDays
        })));
        return res.status(200).json(result)
    } catch (error) {
        next(new HttpError(error.message || 'Get cart failed', 500));

    }
}
const addCart = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const { costumeId } = req.body;

        const costume = await Costume.findById(costumeId);
        if (!costume) {
            return next(new HttpError("Costume not found", 404));
        }

        let size = "M";
        let rentalPrice = 0;
        const quantity = 1;

        // Chỉ lấy variant đầu tiên vì không có input size từ client
        if (costume.variants && costume.variants.length > 0) {
            const variant = costume.variants[0];
            size = variant.size;
            rentalPrice = variant.price || 0;
        }

        // Cài đặt thời gian thuê (mặc định thuê 1 ngày)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const newItem = {
            costume: costumeId,
            size,
            quantity,
            rentalPrice,
            startDate,
            endDate
        };

        // 1. Thử tăng số lượng nếu item (costumeId + size) đã tồn tại trong giỏ
        let cart = await Cart.findOneAndUpdate(
            { customerId, "items.costume": costumeId, "items.size": size },
            { $inc: { "items.$.quantity": quantity } },
            { new: true }
        );

        // 2. Nếu chưa có item trong giỏ (hoặc giỏ chưa tồn tại), thêm mới / tạo giỏ
        if (!cart) {
            cart = await Cart.findOneAndUpdate(
                { customerId },
                { $push: { items: newItem } },
                { new: true, upsert: true }
            );
        }

        return res.status(200).json({ message: "Add to cart successfully", cart });
    } catch (error) {
        next(new HttpError(error.message || 'Creating cart failed', 500));
    }
}

module.exports = { getAllCarts, addCart };