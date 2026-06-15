const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const Rental = require("../models/rental.model");
const ghnService = require("../services/ghn.service");

require("dotenv").config();

// =======================
// CREATE PAYMENT URL
// =======================
const createPaymentUrl = async (req, res) => {
    try {
        const { rentalId } = req.body;

        // Tìm rental
        const rental = await Rental.findById(rentalId);

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: "Rental not found",
            });
        }

        // Chỉ thanh toán đơn pending
        if (rental.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Rental already paid",
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

        let vnp_Params = {};

        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";

        // dùng rental id làm mã giao dịch
        vnp_Params["vnp_TxnRef"] =
            rental._id.toString();

        vnp_Params["vnp_OrderInfo"] =
            `Thanh toan don thue ${rental._id}`;

        vnp_Params["vnp_OrderType"] = "other";

        // VNPAY yêu cầu *100
        vnp_Params["vnp_Amount"] =
            rental.totalAmount * 100;

        vnp_Params["vnp_ReturnUrl"] =
            returnUrl;

        vnp_Params["vnp_IpAddr"] =
            ipAddr;

        vnp_Params["vnp_CreateDate"] =
            createDate;

        vnp_Params["vnp_ExpireDate"] =
            expireDate;

        // sort key alphabet
        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(
            vnp_Params,
            { encode: false }
        );

        const hmac = crypto.createHmac(
            "sha512",
            secretKey
        );

        const signed = hmac
            .update(
                Buffer.from(signData, "utf-8")
            )
            .digest("hex");

        vnp_Params["vnp_SecureHash"] =
            signed;

        const paymentUrl =
            vnpUrl +
            "?" +
            qs.stringify(vnp_Params, {
                encode: false,
            });

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

        const secureHash =
            vnp_Params["vnp_SecureHash"];

        delete vnp_Params[
            "vnp_SecureHash"
        ];

        delete vnp_Params[
            "vnp_SecureHashType"
        ];

        vnp_Params =
            sortObject(vnp_Params);

        const secretKey =
            process.env.VNP_HASHSECRET;

        const signData = qs.stringify(
            vnp_Params,
            { encode: false }
        );

        const hmac =
            crypto.createHmac(
                "sha512",
                secretKey
            );

        const signed = hmac
            .update(
                Buffer.from(
                    signData,
                    "utf-8"
                )
            )
            .digest("hex");

        // checksum fail
        if (secureHash !== signed) {
            return res.status(200).json({
                RspCode: "97",
                Message: "Invalid checksum",
            });
        }

        const rentalId =
            vnp_Params["vnp_TxnRef"];

        const responseCode =
            vnp_Params[
                "vnp_ResponseCode"
            ];

        const rental =
            await Rental.findById(
                rentalId
            );

        if (!rental) {
            return res.status(200).json({
                RspCode: "01",
                Message:
                    "Rental not found",
            });
        }

        // tránh update nhiều lần
        if (
            rental.paymentStatus ===
            "paid"
        ) {
            return res.status(200).json({
                RspCode: "02",
                Message:
                    "Order already updated",
            });
        }

        // payment success
        if (responseCode === "00") {
            rental.paymentStatus = "paid";
            // Thanh toán thành công -> Chuyển sang cho Staff chuẩn bị đồ
            rental.status = "preparing";

            rental.vnpayInfo = {
                txnRef: vnp_Params["vnp_TxnRef"],
                transactionNo: vnp_Params["vnp_TransactionNo"],
                bankCode: vnp_Params["vnp_BankCode"],
                responseCode,
                payDate: vnp_Params["vnp_PayDate"],
            };

            await rental.save();

            return res.status(200).json({
                RspCode: "00",
                Message: "Success",
            });
        }

        // payment fail
        rental.paymentStatus =
            "failed";

        await rental.save();

        return res.status(200).json({
            RspCode: "00",
            Message:
                "Payment failed handled",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            RspCode: "99",
            Message: "Unknown error",
        });
    }
};

// =======================
// RETURN URL
// =======================
const vnpayReturn = async (
    req,
    res
) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];
        
        // Tạo bản copy để không mất dữ liệu query trên req
        let paramsForSign = { ...vnp_Params };
        delete paramsForSign["vnp_SecureHash"];
        delete paramsForSign["vnp_SecureHashType"];
        
        paramsForSign = sortObject(paramsForSign);
        const secretKey = process.env.VNP_HASHSECRET;
        const signData = qs.stringify(paramsForSign, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        // Dành cho môi trường Localhost (IPN không chạy được)
        // Chúng ta mượn ReturnURL để cập nhật Database
        if (secureHash === signed) {
            const rentalId = vnp_Params["vnp_TxnRef"];
            const responseCode = vnp_Params["vnp_ResponseCode"];
            
            if (responseCode === "00") {
                const rental = await Rental.findById(rentalId);
                if (rental && rental.paymentStatus !== "paid") {
                    rental.paymentStatus = "paid";
                    // Thanh toán thành công -> Chuyển sang cho Staff chuẩn bị đồ
                    rental.status = "preparing";

                    rental.vnpayInfo = {
                        txnRef: vnp_Params["vnp_TxnRef"],
                        transactionNo: vnp_Params["vnp_TransactionNo"],
                        bankCode: vnp_Params["vnp_BankCode"],
                        responseCode,
                        payDate: vnp_Params["vnp_PayDate"],
                    };
                    await rental.save();
                }
            }
        }

        // redirect về React
        return res.redirect(
            `${process.env.CLIENT_URL}/rental-history`
        );
    } catch (error) {
        console.error(error);

        return res.redirect(
            `${process.env.CLIENT_URL}/rental-history`
        );
    }
};

// =======================
// SORT PARAM
// =======================
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

module.exports = {
    createPaymentUrl,
    vnpayIpn,
    vnpayReturn,
};