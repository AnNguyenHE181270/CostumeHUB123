const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const User = require("../models/user.model");
const TransactionHistory = require("../models/transactionHistory.model");
const notificationService = require("../services/notification.service");

require("dotenv").config();

const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(process.env.VNP_HASHSECRET || 'default_secret_key_123')).digest('base64').substr(0, 32);

function encryptData(data) {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptData(text) {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
    } catch (e) {
        return null;
    }
}

const createPaymentUrl = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.userData.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Số tiền không hợp lệ",
            });
        }

        const ipAddr =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "127.0.0.1";

        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const createDate = moment().format("YYYYMMDDHHmmss");
        const expireDate = moment()
            .add(15, "minutes")
            .format("YYYYMMDDHHmmss");

        const txnRef = `TOPUP_${userId}_${Date.now()}`;

        // Lưu transaction pending
        const newTopUp = new TransactionHistory({
            user: userId,
            txnRef,
            amount,
            status: "pending"
        });
        await newTopUp.save();

        let vnp_Params = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";
        vnp_Params["vnp_TxnRef"] = txnRef;
        vnp_Params["vnp_OrderInfo"] = `Nap tien vao vi ${userId}`;
        vnp_Params["vnp_OrderType"] = "other";
        vnp_Params["vnp_Amount"] = amount * 100;
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        vnp_Params["vnp_IpAddr"] = ipAddr;
        vnp_Params["vnp_CreateDate"] = createDate;
        vnp_Params["vnp_ExpireDate"] = expireDate;

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        vnp_Params["vnp_SecureHash"] = signed;

        const paymentUrl =
            vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            success: true,
            paymentUrl,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// =======================
// VNPAY IPN
// =======================
const vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];

        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASHSECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        if (secureHash !== signed) {
            return res.status(200).json({
                RspCode: "97",
                Message: "Invalid checksum",
            });
        }

        const txnRef = vnp_Params["vnp_TxnRef"];
        const responseCode = vnp_Params["vnp_ResponseCode"];

        const vnpayInfoData = { ...vnp_Params }; // Lưu toàn bộ thông tin nhạy cảm từ VNPAY (đã loại bỏ SecureHash)

        const topUp = await TransactionHistory.findOneAndUpdate(
            { txnRef, status: "pending" },
            { 
                status: "success",
                vnpayInfo: encryptData(vnpayInfoData)
            },
            { new: true }
        );

        if (!topUp) {
            return res.status(200).json({
                RspCode: "02",
                Message: "Transaction already updated or not found",
            });
        }

        // Bổ sung: Kiểm tra số tiền
        const vnp_Amount = vnp_Params["vnp_Amount"];
        if (topUp.amount !== vnp_Amount / 100) {
            topUp.status = "failed";
            await topUp.save();
            return res.status(200).json({
                RspCode: "04",
                Message: "Invalid amount",
            });
        }

        if (responseCode === "00") {
            // Cộng tiền vào ví user
            const user = await User.findByIdAndUpdate(topUp.user, { $inc: { balance: topUp.amount } }, { new: true });
            if (user) {

                try {
                    await notificationService.createNotification({
                        userId: user._id,
                        type: 'wallet_topup',
                        title: 'Nạp tiền thành công',
                        message: `Ví của bạn đã được cộng ${topUp.amount.toLocaleString('vi-VN')}đ.`,
                        link: '/user/transactions',
                        relatedId: topUp._id,
                    });
                } catch (notifyError) {
                    console.error('[Notification Error]', notifyError);
                }
            }

            return res.status(200).json({
                RspCode: "00",
                Message: "Success",
            });
        }

        topUp.status = "failed";
        await topUp.save();

        return res.status(200).json({
            RspCode: "00",
            Message: "Payment failed handled",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            RspCode: "99",
            Message: "Unknown error",
        });
    }
};


const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];
        
        let paramsForSign = { ...vnp_Params };
        delete paramsForSign["vnp_SecureHash"];
        delete paramsForSign["vnp_SecureHashType"];
        
        paramsForSign = sortObject(paramsForSign);
        const secretKey = process.env.VNP_HASHSECRET;
        const signData = qs.stringify(paramsForSign, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        if (secureHash === signed) {
            const txnRef = vnp_Params["vnp_TxnRef"];
            const responseCode = vnp_Params["vnp_ResponseCode"];
            
            if (responseCode === "00") {
                const vnpayInfoData = { ...paramsForSign }; // Lưu toàn bộ data (đã loại bỏ SecureHash)

                const topUp = await TransactionHistory.findOneAndUpdate(
                    { txnRef, status: "pending" },
                    { 
                        status: "success",
                        vnpayInfo: encryptData(vnpayInfoData)
                    },
                    { new: true }
                );
                
                if (topUp) {
                    // Bổ sung: Kiểm tra số tiền
                    const vnp_Amount = vnp_Params["vnp_Amount"];
                    if (topUp.amount !== vnp_Amount / 100) {
                        topUp.status = "failed";
                        await topUp.save();
                        return res.redirect(`${process.env.CLIENT_URL}/user/transaction-success`); // Trả về frontend (bạn có thể đổi thành route lỗi sau)
                    }

                    const user = await User.findByIdAndUpdate(topUp.user, { $inc: { balance: topUp.amount } }, { new: true });
                    if (user) {

                        try {
                            await notificationService.createNotification({
                                userId: user._id,
                                type: 'wallet_topup',
                                title: 'Nạp tiền thành công',
                                message: `Ví của bạn đã được cộng ${topUp.amount.toLocaleString('vi-VN')}đ.`,
                                link: '/user/transactions',
                                relatedId: topUp._id,
                            });
                        } catch (notifyError) {
                            console.error('[Notification Error]', notifyError);
                        }
                    }
                }
            }
        }

        return res.redirect(`${process.env.CLIENT_URL}/user/transaction-success`);
    } catch (error) {
        console.error(error);
        return res.redirect(`${process.env.CLIENT_URL}/user/transaction-success`);
    }
};


function sortObject(obj) {
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

const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.userData.id;
        const topUps = await TransactionHistory.find({ user: userId }).select('+vnpayInfo').sort({ createdAt: -1 });
        
        const data = topUps.map(t => {
            const doc = t.toObject();
            if (doc.vnpayInfo) {
                doc.vnpayInfo = decryptData(doc.vnpayInfo);
            }
            return doc;
        });

        return res.status(200).json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch top-up history",
        });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const topUps = await TransactionHistory.find({}).select('+vnpayInfo').sort({ createdAt: -1 }).populate('user', 'username email');
        
        const data = topUps.map(t => {
            const doc = t.toObject();
            if (doc.vnpayInfo) {
                doc.vnpayInfo = decryptData(doc.vnpayInfo);
            }
            return doc;
        });

        return res.status(200).json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all transactions",
        });
    }
};

module.exports = {
    createPaymentUrl,
    vnpayIpn,
    vnpayReturn,
    getTransactionHistory,
    getAllTransactions,
};