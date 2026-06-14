const Cart = require("../models/cart.model");
const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCarts = async (req, res, next) => {
    try {
        const userId = req.userData.id;
        const carts = await Cart.find({ customerId: userId })
            .populate({
                path: "items.costume",
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
            costumeId: item.costume?._id,
            costumeName: item.costume.name,
            image: item.costume?.images?.[0] || null,
            category: item.costume.categoryId.name,
            size: item.size,
            quantity: item.quantity,
            status: item.status,
            startDate: item.startDate,
            endDate: item.endDate,
            rentalRates: item.costume.rentalRates,
            deposit: item.costume?.deposit || 0,
            rentalDays: item.rentalDays,
            rentalPerDay: item.rentalPrice,
            variants: item.costume?.variants || [],
            variant: item.costume?.variants?.find(v => v.size === item.size) || { size: item.size }
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

        if (startNormalized < tomorrow) {
            return next(
                new HttpError("Vui lòng đặt thuê đồ trước ít nhất 1 ngày", 400)
            );
        }

        if (endNormalized < startNormalized) {
            return next(new HttpError("Ngày trả đồ phải lớn hơn hoặc bằng ngày nhận đồ", 400));
        }

        // rentalDays = endDate-startDate +1
        const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) + 1;

        let rentalPrice = costume.rentalRates?.pricePerDay || 0;
        if (rentalDays === 3 && costume.rentalRates?.pricePer3Days) {
            rentalPrice = costume.rentalRates.pricePer3Days;
        } else if (rentalDays === 7 && costume.rentalRates?.pricePerWeek) {
            rentalPrice = costume.rentalRates.pricePerWeek;
        }

        const depositPrice = costume.deposit || 0;

        const newItem = {
            costume: costumeId,
            size,
            quantity: numQuantity,
            rentalPrice,
            depositPrice,
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

                cart = await Cart.findOneAndUpdate(
                    { customerId },
                    { $inc: { [`items.${itemIndex}.quantity`]: numQuantity } },
                    { new: true }
                );
            } else {
                cart = await Cart.findOneAndUpdate(
                    { customerId },
                    { $push: { items: newItem } },
                    { new: true }
                );
            }
        }

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


const updateCart = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const costumeId = req.params.costumeId;
        const { size, quantity, startDate, endDate } = req.body;

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

        const rentalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) + 1;
        let rentalPrice = costume.rentalRates?.pricePerDay || 0;
        if (rentalDays === 3 && costume.rentalRates?.pricePer3Days) {
            rentalPrice = costume.rentalRates.pricePer3Days / 3;
        } else if (rentalDays === 7 && costume.rentalRates?.pricePerWeek) {
            rentalPrice = costume.rentalRates.pricePerWeek / 7;
        }

        const depositPrice = costume.deposit || 0;

        // Lấy thông tin định danh cũ (nếu có update Size/Date)
        const oldSize = req.body.oldSize || size;
        const oldStart = req.body.oldStartDate ? new Date(req.body.oldStartDate) : start;
        const oldEnd = req.body.oldEndDate ? new Date(req.body.oldEndDate) : end;

        let cart = await Cart.findOne({ customerId });
        if (!cart) {
            return next(new HttpError("Cart not found", 404));
        }

        // Tìm vị trí của item cũ trong giỏ hàng
        const itemIndex = cart.items.findIndex(item =>
            item.costume.toString() === costumeId &&
            item.size === oldSize &&
            new Date(item.startDate).getTime() === oldStart.getTime() &&
            new Date(item.endDate).getTime() === oldEnd.getTime()
        );

        if (itemIndex === -1) {
            return next(new HttpError("Không tìm thấy sản phẩm trong giỏ hàng để cập nhật", 404));
        }

        // Nếu thông tin size hoặc date bị thay đổi, ta cần check xem item mới có trùng với một item khác đã có trong giỏ không
        const isIdentityChanged = size !== oldSize || start.getTime() !== oldStart.getTime() || end.getTime() !== oldEnd.getTime();

        if (isIdentityChanged) {
            const existingItemIndex = cart.items.findIndex((item, index) =>
                index !== itemIndex &&
                item.costume.toString() === costumeId &&
                item.size === size &&
                new Date(item.startDate).getTime() === start.getTime() &&
                new Date(item.endDate).getTime() === end.getTime()
            );

            if (existingItemIndex > -1) {
                // Đã có item giống hệt, cộng dồn quantity
                const newTotalQuantity = cart.items[existingItemIndex].quantity + numQuantity;
                if (newTotalQuantity > variant.availableStock) {
                    return next(new HttpError(`Số lượng tổng trong giỏ vượt quá tồn kho. Kho chỉ còn ${variant.availableStock}`, 400));
                }

                cart.items[existingItemIndex].quantity = newTotalQuantity;
                cart.items[existingItemIndex].rentalDays = rentalDays;
                cart.items[existingItemIndex].rentalPrice = rentalPrice;
                cart.items[existingItemIndex].depositPrice = depositPrice;

                // Xóa item cũ đi
                cart.items.splice(itemIndex, 1);
            } else {
                // Không trùng, chỉ cần cập nhật item hiện tại
                cart.items[itemIndex].size = size;
                cart.items[itemIndex].quantity = numQuantity;
                cart.items[itemIndex].startDate = start;
                cart.items[itemIndex].endDate = end;
                cart.items[itemIndex].rentalDays = rentalDays;
                cart.items[itemIndex].rentalPrice = rentalPrice;
                cart.items[itemIndex].depositPrice = depositPrice;
            }
        } else {
            // Chỉ cập nhật số lượng (Quantity)
            cart.items[itemIndex].quantity = numQuantity;
        }

        await cart.save();

        await cart.populate({
            path: "items.costume",
            select: "name categoryId images",
            populate: { path: "categoryId", select: "name" }
        });

        return res.status(200).json({ message: "Cập nhật giỏ hàng thành công", cart });
    } catch (error) {
        next(new HttpError(error.message || 'Cập nhật giỏ hàng thất bại', 500));
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


const removeCartItem = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        // Nhận dữ liệu item cần xóa từ body
        const { costumeId, size, startDate, endDate } = req.body;

        if (!costumeId) {
            return next(new HttpError("Vui lòng cung cấp costumeId", 400));
        }

        let cart = await Cart.findOne({ customerId });
        if (!cart) {
            return res.status(200).json({ message: "Giỏ hàng đã rỗng" });
        }

        // Nếu có truyền đủ size và date thì xóa chính xác item đó (khi xóa trong CartPage)
        if (size && startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();

            cart.items = cart.items.filter(item => {
                return !(item.costume.toString() === costumeId &&
                    item.size === size &&
                    new Date(item.startDate).getTime() === start &&
                    new Date(item.endDate).getTime() === end);
            });
        } else {
            // Nếu chỉ truyền costumeId thì xóa tất cả các biến thể của sản phẩm đó (khi bỏ Thêm giỏ hàng ở ProductCard)
            cart.items = cart.items.filter(item => item.costume.toString() !== costumeId);
        }

        await cart.save();
        return res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng", cart });
    } catch (error) {
        next(new HttpError(error.message || 'Xóa sản phẩm thất bại', 500));
    }
};

module.exports = { getAllCarts, addCart, updateCart, removeAllCartByCustomer, removeCartItem };