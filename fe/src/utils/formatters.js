/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 */
export function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
