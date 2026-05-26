const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const sendEmail = require("../services/email.service");
const crypto = require("crypto");
const OTP_TTL_MS = 1 * 60 * 1000;

const register = async (req, res, next) => {
  let newUser = null;

  try {
    const { fullName, email, phone, password, gender, dateOfBirth } = req.body;

    const now = new Date();

    const existUser = await User.findOne({ email });

    if (existUser && existUser.status === "active") {
      return next(
        new HttpError(
          "An account with this email already exists. Please log in instead.",
          422,
        ),
      );
    }

    if (
      existUser &&
      existUser.status == "blocked" &&
      existUser.isEmailVerified == true
    ) {
      return next(
        new HttpError("This account cannot be registered again.", 403),
      );
    }

    const roleUser = await Role.findOne({ name: "online-customer" });

    if (!roleUser) {
      return next(new HttpError("Online customer role not found", 404));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, salt);

    const otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
    const otpCooldownUntil = new Date(now.getTime() + 60 * 1000);

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
          roles: roleUser._id,
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
        message:
          "Registration successful. Please check your email for the OTP.",
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
      roles: roleUser._id,
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

    const existUser = await User.findOne({ email }).select("+password");
    if (!existUser) {
      return next(new HttpError("User not found.", 404));
    }
    if (existUser.status == "blocked") {
      return next(new HttpError("User is blocked", 400));
    }
    const checkPassword = await bcrypt.compare(password, existUser.password);
    if (!checkPassword) {
      return next(new HttpError("Incorrect password.", 401));
    }

    const token = jwt.sign(
      {
        id: existUser._id,
        email: existUser.email,
        role: existUser.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        provider: user.provider,
        roles: user.roles,
      },
    });
  } catch (err) {
    return next(
      new HttpError(err.message || "Email verification failed.", 500),
    );
  }
};

<<<<<<< HEAD

=======
>>>>>>> b01fddeff5d7a77046cc9cf9366378f88e5de790
const sendResetPasswordEmail = async (email, resetUrl, fullName) => {
  await sendEmail({
    to: email,
    subject: "Vogue Rental — Đặt lại mật khẩu",

    text: `Bạn yêu cầu đặt lại mật khẩu. Nhấn vào link sau (hiệu lực 15 phút): ${resetUrl}`,

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
                Đặt lại mật khẩu
              </h1>

              <p style="
                margin:16px 0 0;
                font-size:15px;
                color:#333333;
                line-height:1.6;
              ">
                Chào ${fullName},<br/>
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để chọn mật khẩu mới.
              </p>

              <!-- CTA BUTTON -->
              <div style="margin:36px 0; text-align:center;">
                <a href="${resetUrl}" target="_blank" style="
                  display:inline-block;
                  background:linear-gradient(to right, #f94a00, #fd7b03);
                  color:#ffffff;
                  text-decoration:none;
                  font-size:16px;
                  font-weight:600;
                  letter-spacing:0.5px;
                  padding:16px 40px;
                  border-radius:12px;
                ">
                  Đặt lại mật khẩu
                </a>
              </div>

              <!-- INFO -->
              <p style="
                margin-top:24px;
                font-size:13px;
                color:#707070;
                line-height:1.5;
              ">
                Liên kết này sẽ hết hạn sau <b style="color:#020108;">15 phút</b>.
              </p>

              <p style="
                margin-top:8px;
                font-size:12px;
                color:#858585;
                line-height:1.5;
              ">
                Nếu nút không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt: <br/>
                <a href="${resetUrl}" style="color:#0057f3; word-break:break-all;">${resetUrl}</a>
              </p>

              <p style="
                margin-top:16px;
                font-size:12px;
                color:#858585;
                line-height:1.5;
              ">
                Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này một cách an toàn.
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

const forgotPassword = async (req, res, next) => {

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new HttpError(
          "If an account with this email exists, password reset instructions have been sent.",
          200,
        ),
      );
    }

<<<<<<< HEAD
=======
    if (!user.isEmailVerified) {
      return next(
        new HttpError(
          "Email is not verified. Please verify your email before resetting your password.",
          403,
        ),
      );
    }

    if (user.status === "blocked") {
      return next(
        new HttpError(
          "Your account has been blocked. Please contact support for assistance.",
          403,
        ),
      );
    }
>>>>>>> b01fddeff5d7a77046cc9cf9366378f88e5de790
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    await sendResetPasswordEmail(user.email, resetUrl, user.fullName);
    res
      .status(200)
      .json({
        message:
          "If an account with this email exists, password reset instructions have been sent.",
      });
  } catch (err) {
    return next(new HttpError(err.message || "Error system.", 500));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const password = req.body.password;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");


    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new HttpError("Invalid or expired token.", 400));
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
    return next(new HttpError(err.message || "Password reset failed.", 500));
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};
