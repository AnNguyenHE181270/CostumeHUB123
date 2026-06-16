const GHN_URL = process.env.GHN_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';
const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

const getHeaders = (includeShopId = false) => {
    const headers = {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json'
    };
    if (includeShopId) {
        headers['ShopId'] = GHN_SHOP_ID;
    }
    return headers;
};

// Lấy danh sách Tỉnh/Thành phố
const getProvinces = async () => {
    try {
        const baseUrl = GHN_URL.replace('/v2', '');
        const response = await fetch(`${baseUrl}/master-data/province`, {
            method: 'GET',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data;
    } catch (error) {
        console.error('GHN getProvinces error:', error.message);
        throw new Error('Lỗi lấy danh sách tỉnh thành GHN');
    }
};

// Lấy danh sách Quận/Huyện
const getDistricts = async (provinceId) => {
    try {
        const baseUrl = GHN_URL.replace('/v2', '');
        const response = await fetch(`${baseUrl}/master-data/district?province_id=${provinceId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data;
    } catch (error) {
        console.error('GHN getDistricts error:', error.message);
        throw new Error('Lỗi lấy danh sách quận huyện GHN');
    }
};

// Lấy danh sách Phường/Xã
const getWards = async (districtId) => {
    try {
        const baseUrl = GHN_URL.replace('/v2', '');
        const response = await fetch(`${baseUrl}/master-data/ward?district_id=${districtId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data;
    } catch (error) {
        console.error('GHN getWards error:', error.message);
        throw new Error('Lỗi lấy danh sách phường xã GHN');
    }
};

// Đẩy đơn sang GHN
const createOrder = async (orderData) => {
    try {
        const response = await fetch(`${GHN_URL}/shipping-order/create`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data; // Trả về thông tin đơn, trong đó có order_code
    } catch (error) {
        console.error('GHN createOrder error:', error.message);
        throw new Error(error.message || 'Lỗi đẩy đơn sang GHN');
    }
};

module.exports = {
    getProvinces,
    getDistricts,
    getWards,
    createOrder
};
