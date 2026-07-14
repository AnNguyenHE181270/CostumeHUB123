
export function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
export function formatDate(dateString) {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN") + " - " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
}

export function formatDateNoHours(dateString) {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN")
}

export function formatOrderId(orderId) {
    if (!orderId) return "";
    return `#${orderId.toString().slice(-6).toUpperCase()}`;
}

export function getRentalDays(start, end) {
    if (!start || !end) return 1;
    const startObj = new Date(start);
    const endObj = new Date(end);
    const days = Math.ceil((endObj - startObj) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
};

// Chính sách giá thuê: 1-3 ngày đầu giữ nguyên giá, từ ngày thứ 4 trở đi mỗi ngày tăng thêm 5% giá thuê.
export function getRentalPriceFactor(rentalDays) {
    const extraDays = Math.max(0, (rentalDays || 0) - 3);
    return 1 + extraDays * 0.05;
}

export function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
}