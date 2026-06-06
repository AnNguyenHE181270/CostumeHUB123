const Cart = require("../models/cart.model");
const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCarts = async (req, res, next) => {
    try {
        const userId = req.userData.id;
        const carts = await Cart.find({ customerId: userId })
            .populate({
                path: "items.costume",
                select: "name categoryId images",
                populate: {
                    path: "categoryId",
                    select: "name"
                }
            }).lean();

        if (carts.length === 0) {
            return next(new HttpError("Cart is empty.", 404));
        }

        const result = carts.flatMap(cart => cart.items.map(item => ({
            cartItemId: item._id,
            _id: item.costume?._id,
            costumeName: item.costume?.name || "",
            image: item.costume?.images?.[0] || null,
            category: item.costume?.categoryId?.name || "",
            size: item.size,
            quantity: item.quantity,
            status: item.status,
            startDate: item.startDate,
            endDate: item.endDate,
            rentalPrice: item.rentalPrice,
            rentalDays: item.rentalDays,
        })));
        return res.status(200).json(result)
    } catch (error) {
        next(new HttpError(error.message || 'Get cart failed', 500));

    }
}

const addCart = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const { costumeId, size, quantity, startDate, endDate } = req.body;

        const costume = await Costume.findById(costumeId);
        if (!costume) {
            return next(new HttpError("Costume not found", 404));
        }

        const numQuantity = Number(quantity);

        // fields required
        if (!size || !numQuantity || !startDate || !endDate) {
            return next(new HttpError("Vui lòng cung cấp đủ thông tin: size, quantity, startDate, endDate", 400));
        }

        // Size tồn tại
        const variant = costume.variants.find((v) => v.size === size);
        if (!variant) {
            return next(new HttpError(`Sản phẩm không có size ${size}`, 404));
        }

        // quantity>availableStock
        if (numQuantity > variant.availableStock) {
            return next(new HttpError(`Số lượng yêu cầu vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400));
        }

        // startDate < endDate
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return next(new HttpError("Ngày tháng không hợp lệ", 400));
        }

        // startDate > now, endDate > now

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime());
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startNormalized = new Date(start);
        startNormalized.setHours(0, 0, 0, 0);

        const endNormalized = new Date(end);
        endNormalized.setHours(0, 0, 0, 0);

        if (startNormalized <= tomorrow) {
            return next(new HttpError("Ngày nhận đồ phải sau ngày mai", 400));
        }

        if (endNormalized < startNormalized) {
            return next(new HttpError("Ngày trả đồ phải lớn hơn hoặc bằng ngày nhận đồ", 400));
        }

        // rentalDays = endDate-startDate +1
        const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const rentalPrice = costume.price

        const newItem = {
            costume: costumeId,
            size,
            quantity: numQuantity,
            rentalPrice,
            startDate: start,
            endDate: end,
            rentalDays,
        };

        let cart = await Cart.findOne({ customerId });

        if (!cart) {
            // nếu cart chưa tồn tại thì tạo cart mới
            cart = await Cart.create({
                customerId,
                items: [newItem],
            });
        } else {
            // nếu cart tồn tại => add costume vào items hoặc cộng dồn quantity nếu đã tồn tại cùng size và ngày
            const itemIndex = cart.items.findIndex((item) =>
                item.costume.toString() === costumeId &&
                item.size === size &&
                new Date(item.startDate).getTime() === start.getTime() &&
                new Date(item.endDate).getTime() === end.getTime()
            );

            if (itemIndex > -1) {
                const newQuantity = cart.items[itemIndex].quantity + numQuantity;
                if (newQuantity > variant.availableStock) {
                    return next(new HttpError(`Số lượng tổng trong giỏ vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400));
                }

                // Dùng $inc (Atomic update) để cộng dồn trực tiếp trong Database, khắc phục lỗi VersionError (Race Condition)
                cart = await Cart.findOneAndUpdate(
                    { customerId },
                    { $inc: { [`items.${itemIndex}.quantity`]: numQuantity } },
                    { new: true }
                );
            } else {
                // Dùng $push (Atomic update) để nhét item vào mảng an toàn
                cart = await Cart.findOneAndUpdate(
                    { customerId },
                    { $push: { items: newItem } },
                    { new: true }
                );
            }
        }

        // Populate dữ liệu để hiển thị chi tiết ở Postman giống hệt lúc Get Cart
        if (cart) {
            await cart.populate({
                path: "items.costume",
                select: "name categoryId images",
                populate: { path: "categoryId", select: "name" }
            });
        }

        return res.status(200).json({ message: "Add to cart successfully", cart });
    } catch (error) {
        next(new HttpError(error.message || 'Creating cart failed', 500));
    }
}

const removeAllCartByCustomer = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        await Cart.findOneAndDelete({ customerId });
        return res.status(200).json({ message: "Đã xóa toàn bộ giỏ hàng thành công" });
    } catch (error) {
        next(new HttpError(error.message || 'Xóa giỏ hàng thất bại', 500));
    }
};

module.exports = { getAllCarts, addCart, removeAllCartByCustomer };