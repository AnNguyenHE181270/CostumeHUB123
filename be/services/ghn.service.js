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

// Địa chỉ gốc cố định của shop: Đại học FPT Hòa Lạc, Thạch Thất, Hà Nội
const SHOP_ORIGIN = {
    province_id: 201,
    district_id: 1808,
    ward_code: '1B1919',
};

// Lấy dịch vụ vận chuyển khả dụng giữa 2 quận/huyện (dùng để lấy service_id cho leadtime)
const getAvailableServices = async (fromDistrictId, toDistrictId) => {
    try {
        const response = await fetch(`${GHN_URL}/shipping-order/available-services`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({
                shop_id: Number(GHN_SHOP_ID),
                from_district: fromDistrictId,
                to_district: toDistrictId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data || [];
    } catch (error) {
        console.error('GHN getAvailableServices error:', error.message);
        throw new Error('Lỗi lấy dịch vụ vận chuyển GHN');
    }
};

// Lấy thời gian giao hàng dự kiến (leadtime) cho một tuyến vận chuyển
const getLeadTime = async ({ fromDistrictId, fromWardCode, toDistrictId, toWardCode, serviceId }) => {
    try {
        const response = await fetch(`${GHN_URL}/shipping-order/leadtime`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({
                from_district_id: fromDistrictId,
                from_ward_code: fromWardCode,
                to_district_id: toDistrictId,
                to_ward_code: toWardCode,
                service_id: serviceId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi GHN');
        return data.data;
    } catch (error) {
        console.error('GHN getLeadTime error:', error.message);
        throw new Error('Lỗi lấy thời gian giao hàng dự kiến GHN');
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
    SHOP_ORIGIN,
    getProvinces,
    getDistricts,
    getWards,
    getAvailableServices,
    getLeadTime,
    createOrder
};
