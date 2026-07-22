const crypto = require("crypto");
const { PayOS } = require("@payos/node");
const User = require("../models/user.model");
const TransactionHistory = require("../models/transactionHistory.model");
const notificationService = require("../services/notification.service");
const sendEmail = require("../services/email.service");
const bcrypt = require("bcryptjs");

require("dotenv").config();

// Initialize PayOS
// Ensure you have PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "YOUR_CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "YOUR_API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "YOUR_CHECKSUM_KEY"
});

const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(process.env.PAYOS_CHECKSUM_KEY || 'default_secret_key_123')).digest('base64').substring(0, 32);

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

        const returnUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/user/transaction-success` : "http://localhost:3000/user/transaction-success";
        const cancelUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/user/transaction-cancel` : "http://localhost:3000/user/transaction-cancel";

        // orderCode must be a number for payOS (max 9007199254740991)
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

        // Lưu transaction pending
        const newTopUp = new TransactionHistory({
            user: userId,
            orderCode,
            amount,
            status: "pending"
        });
        await newTopUp.save();

        const requestData = {
            orderCode: orderCode,
            amount: amount,
            description: `Nap tien ${orderCode}`,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl,
        };

        const paymentLinkResponse = await payos.paymentRequests.create(requestData);

        return res.status(200).json({
            success: true,
            paymentUrl: paymentLinkResponse.checkoutUrl,
            paymentLink: paymentLinkResponse
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
// PAYOS WEBHOOK
// =======================
const payosWebhook = async (req, res) => {
    try {
        const webhookData = await payos.webhooks.verify(req.body);

        const orderCode = webhookData.orderCode;
        
        const topUp = await TransactionHistory.findOne({ orderCode, status: "pending" });

        if (!topUp) {
            return res.json({
                success: true,
                message: "Transaction not found or already processed"
            });
        }

        // Kiểm tra số tiền
        if (topUp.amount !== webhookData.amount) {
            topUp.status = "failed";
            topUp.payosInfo = encryptData(webhookData);
            await topUp.save();
            return res.json({
                success: true,
                message: "Amount mismatch"
            });
        }

        topUp.status = "success";
        topUp.payosInfo = encryptData(webhookData);
        await topUp.save();

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

        return res.json({
            success: true,
            message: "Webhook processed"
        });
    } catch (error) {
        console.error("Webhook error:", error);
        return res.status(400).json({
            success: false,
            message: "Invalid webhook data",
        });
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.userData.id;
        const topUps = await TransactionHistory.find({ user: userId }).select('+payosInfo').sort({ createdAt: -1 });
        
        const data = topUps.map(t => {
            const doc = t.toObject();
            if (doc.payosInfo) {
                doc.payosInfo = decryptData(doc.payosInfo);
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
        const topUps = await TransactionHistory.find({}).select('+payosInfo').sort({ createdAt: -1 }).populate('user', 'fullName email');
        
        const data = topUps.map(t => {
            const doc = t.toObject();
            if (doc.payosInfo) {
                doc.payosInfo = decryptData(doc.payosInfo);
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

const syncTransaction = async (req, res) => {
    try {
        const { orderCode } = req.body;
        const numericOrderCode = Number(orderCode);
        const topUp = await TransactionHistory.findOne({ orderCode: numericOrderCode, user: req.userData.id });
        
        if (!topUp) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        if (topUp.status !== "pending") {
            return res.json({ success: true, data: topUp, message: "Already processed" });
        }

        // Fetch status from PayOS
        const paymentInfo = await payos.paymentRequests.get(numericOrderCode);
        
        if (paymentInfo && paymentInfo.status === "PAID") {
            topUp.status = "success";
            topUp.payosInfo = encryptData(paymentInfo);
            await topUp.save();

            // Add money to user wallet
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
        } else if (paymentInfo && (paymentInfo.status === "CANCELLED" || paymentInfo.status === "FAILED")) {
            topUp.status = "failed";
            await topUp.save();
        }

        return res.json({ success: true, data: topUp });

    } catch (error) {
        console.error("Sync transaction error:", error);
        return res.status(500).json({ success: false, message: "Failed to sync transaction" });
    }
};

const sendWithdrawOtp = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.userData.id;
        
        if (!password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu" });
        }

        const user = await User.findById(userId).select("+password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Mật khẩu không chính xác" });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        // Send email
        await sendEmail({
            to: user.email,
            subject: "Mã OTP Xác Nhận Rút Tiền - CostumeHUB",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Xác Nhận Rút Tiền</h2>
                    <p>Chào ${user.fullName},</p>
                    <p>Bạn đã yêu cầu rút tiền từ ví CostumeHUB. Vui lòng sử dụng mã OTP dưới đây để xác nhận giao dịch:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
                    <p>Mã này có hiệu lực trong 5 phút.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ ngay lập tức.</p>
                    <p>Trân trọng,<br/>Đội ngũ CostumeHUB</p>
                </div>
            `
        });

        return res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
    } catch (error) {
        console.error("sendWithdrawOtp error:", error);
        return res.status(500).json({ success: false, message: "Có lỗi xảy ra khi gửi OTP" });
    }
};

const requestWithdraw = async (req, res) => {
    try {
        const { amount, bankName, accountNumber, accountName, otp } = req.body;
        const userId = req.userData.id;

        if (!otp) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mã OTP" });
        }

        if (!amount || amount < 10000) {
            return res.status(400).json({ success: false, message: "Số tiền rút tối thiểu là 10,000đ" });
        }
        if (!bankName || !accountNumber || !accountName) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin ngân hàng" });
        }

        const user = await User.findById(userId).select("+otpCode +otpExpires");
        if (!user || user.balance < amount) {
            return res.status(400).json({ success: false, message: "Số dư không đủ để rút tiền" });
        }

        if (!user.otpCode || user.otpCode !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        // Clear OTP
        user.otpCode = undefined;
        user.otpExpires = undefined;

        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

        user.balance -= amount;
        await user.save();

        const withdrawRequest = new TransactionHistory({
            user: userId,
            orderCode,
            amount,
            type: "WITHDRAW",
            status: "pending",
            bankName,
            accountNumber,
            accountName
        });
        await withdrawRequest.save();

        if (user) {
            try {
                await notificationService.createNotification({
                    userId: user._id,
                    type: 'wallet_withdraw_request',
                    title: 'Yêu cầu rút tiền',
                    message: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đang được chờ xử lý.`,
                    link: '/user/transactions',
                    relatedId: withdrawRequest._id,
                });
            } catch (notifyError) {
                console.error('[Notification Error]', notifyError);
            }
        }

        return res.status(200).json({ success: true, message: "Tạo yêu cầu rút tiền thành công", data: withdrawRequest });
    } catch (error) {
        console.error("requestWithdraw error:", error);
        return res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tạo yêu cầu rút tiền" });
    }
};

const updateWithdrawStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status } = req.body; // "success" or "failed"
        
        if (!["success", "failed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        const transaction = await TransactionHistory.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
        }

        if (transaction.type !== "WITHDRAW" || transaction.status !== "pending") {
            return res.status(400).json({ success: false, message: "Giao dịch không hợp lệ để cập nhật" });
        }

        transaction.status = status;
        await transaction.save();

        if (status === "failed") {
            // Hoàn tiền lại cho user
            const user = await User.findById(transaction.user);
            if (user) {
                user.balance += transaction.amount;
                await user.save();
                
                try {
                    await notificationService.createNotification({
                        userId: user._id,
                        type: 'wallet_withdraw_failed',
                        title: 'Rút tiền bị từ chối',
                        message: `Yêu cầu rút ${transaction.amount.toLocaleString('vi-VN')}đ đã bị từ chối. Tiền đã được hoàn lại vào ví của bạn.`,
                        link: '/user/transactions',
                        relatedId: transaction._id,
                    });
                } catch (notifyError) {
                    console.error('[Notification Error]', notifyError);
                }
            }
        } else {
             const user = await User.findById(transaction.user);
             if (user) {
                 try {
                     await notificationService.createNotification({
                         userId: user._id,
                         type: 'wallet_withdraw_success',
                         title: 'Rút tiền thành công',
                         message: `Yêu cầu rút ${transaction.amount.toLocaleString('vi-VN')}đ đã được duyệt. Vui lòng kiểm tra tài khoản ngân hàng của bạn.`,
                         link: '/user/transactions',
                         relatedId: transaction._id,
                     });
                 } catch (notifyError) {
                     console.error('[Notification Error]', notifyError);
                 }
             }
        }

        return res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${status}`, data: transaction });

    } catch (error) {
        console.error("updateWithdrawStatus error:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

module.exports = {
    createPaymentUrl,
    payosWebhook,
    getTransactionHistory,
    getAllTransactions,
    syncTransaction,
    requestWithdraw,
    sendWithdrawOtp,
    updateWithdrawStatus,
};
