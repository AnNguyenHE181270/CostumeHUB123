const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');
const Rental = require('../models/rental.model');
require('dotenv').config();

const vnp_TmnCode = process.env.VNP_TMNCODE || 'MOCK_TMNCODE';
const vnp_HashSecret = process.env.VNP_HASHSECRET || 'MOCK_HASHSECRET';
const vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/user/transaction-success` : "http://localhost:3000/user/transaction-success";

const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

const createPaymentUrl = async (req, res) => {
    try {
        const { amount, orderInfo } = req.body; 
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let tmnCode = vnp_TmnCode;
        let secretKey = vnp_HashSecret;
        let vnpUrl = vnp_Url;
        let returnUrl = vnp_ReturnUrl;
        let orderId = moment(date).format('DDHHmmss'); 
        
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        vnp_Params = sortObject(vnp_Params);
        
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            success: true,
            paymentUrl: vnpUrl
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query; 
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let secretKey = vnp_HashSecret;
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

        if (secureHash === signed) {
            if(vnp_Params['vnp_ResponseCode'] == '00') {
                const rentalId = vnp_Params['vnp_OrderInfo'];
                const order = await Rental.findById(rentalId);
                if (order && order.paymentStatus === 'pending') {
                    order.paymentStatus = 'paid';
                    await order.save();
                }
                return res.status(200).json({ success: true, message: "Giao dịch thành công", orderId: rentalId });
            } else {
                return res.status(400).json({ success: false, message: "Giao dịch thất bại" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Chữ ký không hợp lệ" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];
        
        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        let rentalId = vnp_Params['vnp_OrderInfo'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        let secretKey = vnp_HashSecret;
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     
        
        let paymentStatus = '0'; 
        let checkOrderId = true; 
        let checkAmount = true; 

        const order = await Rental.findById(rentalId);
        if(!order) {
            checkOrderId = false;
        } else {
             checkAmount = order.totalAmount === (vnp_Params['vnp_Amount'] / 100);
             paymentStatus = order.paymentStatus === 'pending' ? '0' : '1';
        }

        if (secureHash === signed) { 
            if (checkOrderId) {
                if (checkAmount) {
                    if (paymentStatus === "0") { 
                        if (rspCode == "00") {
                            order.paymentStatus = 'paid';
                            await order.save();
                            res.status(200).json({RspCode: '00', Message: 'Success'})
                        } else {
                            order.paymentStatus = 'failed';
                            await order.save();
                            res.status(200).json({RspCode: '00', Message: 'Success'})
                        }
                    } else {
                        res.status(200).json({RspCode: '02', Message: 'This order has been updated to the payment status'})
                    }
                } else {
                    res.status(200).json({RspCode: '04', Message: 'Amount invalid'})
                }
            } else {
                res.status(200).json({RspCode: '01', Message: 'Order not found'})
            }
        } else {
            res.status(200).json({RspCode: '97', Message: 'Checksum failed'})
        }
    } catch (error) {
        res.status(500).json({RspCode: '99', Message: 'Unknow error'})
    }
};

module.exports = { createPaymentUrl, vnpayReturn, vnpayIpn };
