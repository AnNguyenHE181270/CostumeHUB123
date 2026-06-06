
export function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
export function formatDate(dateString) {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN") + " - " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
}