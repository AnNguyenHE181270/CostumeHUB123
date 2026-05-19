const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const sendEmail = require("../services/email.service");
const OTP_TTL_MS = 1 * 60 * 1000;

const register = async (req, res, next) => {
    let newUser = null;

    try {
        const { fullName, email, phone, password, gender, dateOfBirth } = req.body;

        const now = new Date();

        const existUser = await User.findOne({ email });

        if (existUser && existUser.status === "active") {
            return next(
                new HttpError("User exists already, please login instead.", 422),
            );
        }

        if (
            existUser &&
            existUser.status == "blocked" &&
            existUser.isEmailVerified == true
        ) {
            return next(
                new HttpError("This account is not allowed to register again.", 403),
            );
        }

        const roleUser = await Role.findOne({ name: "customer" });

        if (!roleUser) {
            return next(new HttpError("Customer role not found", 404));
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, salt);

        const otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
        const otpCooldownUntil = new Date(now.getTime() + 60 * 1000);

        // CASE 1: EMAIL ĐÃ TỒN TẠI NHƯNG CHƯA VERIFY
        if (
            existUser &&
            existUser.status === "pending" &&
            existUser.isEmailVerified == false
        ) {
            const updatedUser = await User.findByIdAndUpdate(
                existUser._id,
                {
                    fullName,
                    phone,
                    password: passwordHash,
                    role: [roleUser._id],
                    gender: gender || null,
                    dateOfBirth: dateOfBirth || null,

                    otpCode: otpHash,
                    otpExpires,
                    otpCooldownUntil,
                    status: "pending",
                },
                { new: true },
            );

            await sendEmailVerification(email, otp, fullName);

            return res.status(201).json({
                message: "Register successfully. Check your email for OTP.",
                type: "new",
                user: {
                    id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                },
                remainingTime: 10 * 60 * 1000,
                nextResendIn: 60 * 1000,
            });
        }

        // CASE 2: EMAIL CHƯA TỒN TẠI
        newUser = await User.create({
            fullName,
            email,
            phone,
            password: passwordHash,
            role: [roleUser._id],
            gender: gender,
            dateOfBirth: dateOfBirth,

            otpCode: otpHash,
            otpExpires,
            otpCooldownUntil,
            status: "pending",
        });

        await sendEmailVerification(email, otp, fullName);

        return res.status(201).json({
            message: "Register successfully. Check your email for OTP.",
            type: "new",
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
            },
            remainingTime: 10 * 60 * 1000,
            nextResendIn: 60 * 1000,
        });
    } catch (err) {
        if (newUser) {
            await User.findByIdAndDelete(newUser._id);
        }

        return next(new HttpError(err.message || "Register failed.", 500));
    }
};

const generateOTP = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
};

const sendEmailVerification = async (email, otp, fullName) => {
    await sendEmail({
        to: email,
        subject: "Vogue Rental — Xác thực tài khoản của bạn",

        text: `Mã xác thực của bạn là: ${otp}`,

        html: `
      <div style="
        margin:0;
        padding:0;
        background:#f7f7f7;
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      ">

        <div style="
          max-width:580px;
          margin:0 auto;
          padding:50px 20px;
        ">

          <!-- MAIN CARD -->
          <div style="
            background:#ffffff;
            border-radius:16px;
            border:1px solid #d7d7d6;
            overflow:hidden;
          ">

            <!-- SUNSET ORANGE TOP BAR -->
            <div style="height:4px; background:linear-gradient(to right, #f94a00, #fd7b03);"></div>

            <div style="padding:48px 40px;">

              <!-- BRAND HEADER -->
              <div style="
                font-size:13px;
                letter-spacing:5px;
                color:#020108;
                text-transform:uppercase;
                font-weight:600;
                margin-bottom:32px;
              ">
                Vogue Rental
              </div>

              <div style="height:1px; width:40px; background:#d7d7d6; margin-bottom:32px;"></div>

              <!-- GREETING -->
              <h1 style="
                margin:0;
                font-family:Georgia,'Times New Roman',serif;
                font-size:28px;
                font-weight:400;
                color:#020108;
                line-height:1.2;
                letter-spacing:-0.5px;
              ">
                Xác thực tài khoản
              </h1>

              <p style="
                margin:16px 0 0;
                font-size:15px;
                color:#333333;
                line-height:1.6;
              ">
                Chào ${fullName},<br/>
                Vui lòng sử dụng mã bên dưới để hoàn tất việc tạo tài khoản của bạn.
              </p>

              <!-- DARK PREMIUM OTP BOX -->
              <div style="
                margin:36px 0;
                background:#020108;
                border-radius:12px;
                padding:32px;
                text-align:center;
              ">

                <div style="
                  font-size:11px;
                  color:#818084;
                  letter-spacing:3px;
                  margin-bottom:14px;
                  text-transform:uppercase;
                ">
                  Mã xác thực
                </div>

                <div style="
                  font-family:'Courier New',Courier,monospace;
                  font-size:38px;
                  font-weight:700;
                  letter-spacing:8px;
                  color:#f94a00;
                ">
                  ${otp}
                </div>
              </div>

              <!-- INFO -->
              <p style="
                margin-top:24px;
                font-size:13px;
                color:#707070;
                line-height:1.5;
              ">
                Mã này sẽ hết hạn sau <b style="color:#020108;">10 phút</b>.
              </p>

              <p style="
                margin-top:8px;
                font-size:12px;
                color:#858585;
                line-height:1.5;
              ">
                Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email một cách an toàn.
              </p>

            </div>

          </div>

          <!-- FOOTER -->
          <div style="
            text-align:center;
            margin-top:28px;
            font-size:11px;
            color:#818084;
            letter-spacing:1.5px;
          ">
            © ${new Date().getFullYear()} VOGUE RENTAL • HÀ NỘI
          </div>

        </div>
      </div>
    `,
    });
};

const verifyOtp = async (req, res, next) => {
    try {
        const { email } = req.params;
        const { otp } = req.body;

        const existUser = await User.findOne({ email }).select(
            "+otpCode +otpExpires +otpCooldownUntil",
        );

        if (!existUser) {
            return next(new HttpError("User not found.", 404));
        }

        if (existUser.status === "active" && existUser.isEmailVerified) {
            return next(new HttpError("User is already verified.", 400));
        }

        if (existUser.status === "blocked") {
            return next(new HttpError("This account is blocked.", 403));
        }

        if (!existUser.otpCode || !existUser.otpExpires) {
            return next(new HttpError("OTP not found. Please register again.", 400));
        }

        const nowDate = new Date();

        if (existUser.otpExpires < nowDate) {
            return next(
                new HttpError("OTP has expired. Please register again.", 400),
            );
        }

        const isValidOtp = await bcrypt.compare(otp, existUser.otpCode);

        if (!isValidOtp) {
            return next(new HttpError("Invalid OTP.", 400));
        }
        existUser.status = "active";
        existUser.isEmailVerified = true;
        existUser.otpCode = null;
        existUser.otpExpires = null;
        existUser.otpCooldownUntil = null;

        await existUser.save();

        return res.status(200).json({
            message: "Email verified successfully.",
            user: {
                id: existUser._id,
                fullName: existUser.fullName,
                email: existUser.email,
                phone: existUser.phone,
                status: existUser.status,
            },
        });
    } catch (err) {
        return next(
            new HttpError(err.message || "Email verification failed.", 500),
        );
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const existUser = await User.findOne({ email });
        if (!existUser) {
            return next(new HttpError("User not found.", 404));
        }
        const checkPassword = await bcrypt.compare(password, existUser.password);
        if (!checkPassword) {
            return next(new HttpError("Incorrect password.", 401));
        }

        const token = jwt.sign(
            {
                id: existUser._id,
                email: existUser.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        return res.status(200).json({
            message: "Login successful.",
            token: token,
        });
    } catch (err) {
        return next(
            new HttpError(err.message || "Email verification failed.", 500),
        );
    }
};

const getProfile = async (req, res, next) => {
    try {
        const email = req.userData.email;

        const user = await User.findOne({ email });
        if (!user) {
            return next(new HttpError("User not found.", 404));
        }
        return res.status(200).json({
            user: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (err) {
        return next(
            new HttpError(err.message || "Email verification failed.", 500),
        );
    }
};

const googleLogin = async (req, res, next) => {
    try {
        const { accessToken } = req.body;

        const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            return next(new HttpError("Xác thực Google thất bại.", 401));
        }

        const googleUser = await response.json();
        const { sub, email, name, picture } = googleUser;

        let isNewUser = false;

        let user = await User.findOne({ email });

        if (user) {
            if (user.provider !== "google") {
                return next(
                    new HttpError(
                        "Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.",
                        400
                    )
                );
            }

            user.lastLogin = new Date();
            await user.save();

        } else {
            isNewUser = true;

            user = await User.create({
                fullName: name,
                email,
                avatar: picture,
                provider: "google",
                providerId: sub,
                isEmailVerified: true,
                status: "active",
                lastLogin: new Date(),
            });
        }

        // check neu co vao dau neu khong co vao home
        const needsMoreInfo =
            !user.phone ||
            !user.gender ||
            !user.dateOfBirth;

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            token,
            user,
            isNewUser,
            needsMoreInfo,
        });

    } catch (err) {
        return next(
            new HttpError(err.message || "Google login failed.", 500)
        );
    }
};


const completeWithGoogle = async (req, res, next) => {
    try {
        const { email } = req.params;
        const { gender, dateOfBirth, phone } = req.body;


        const user = await User.findOne({ email });
        if (!user) {
            return next(new HttpError("User not found.", 404));
        }

        user.gender = gender;
        user.dateOfBirth = dateOfBirth;
        user.phone = phone;

        await user.save();

        const isProfileComplete = !!(user.phone && user.gender && user.dateOfBirth);

        return res.status(200).json({
            success: true,
            message: "Cập nhật hồ sơ thành công!",
            user: user, 
            isProfileComplete: isProfileComplete, // Giúp Frontend biết đã xong chưa
        });
    } catch (err) {
        return next(
            new HttpError(err.message || "Profile update failed.", 500)
        );
    }
};

module.exports = {
    register,
    verifyOtp,
    googleLogin,
    login,
    getProfile,
    completeWithGoogle
};
