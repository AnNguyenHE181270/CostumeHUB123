const Role = require('../models/role.model');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { login, register, forgotPassword } = require('../controllers/user.controller');
const { sendEmail } = require("../services/email.service")
const jwt = require('jsonwebtoken');

// jest.mock('../../models/user.model');
// jest.mock('bcryptjs');
// jest.mock('jsonwebtoken');
// Giả lập toàn bộ file email.service trả về một hàm duy nhất (Default Export)
jest.mock('../services/email.service', () => jest.fn().mockResolvedValue(true));


describe('Login customer', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    //1. Login success
    test('Login success', async () => {
        jest.spyOn(User, 'findOne').mockImplementation(() => ({
            select: jest.fn().mockResolvedValue({
                _id: 'user123',
                email: 'mai@gmail.com',
                password: 'hashedPassword',
                roles: ['customer']
            })
        }));
        bcrypt.genSalt = jest.fn().mockResolvedValue('salt123');
        bcrypt.compare = jest.fn().mockResolvedValue(true);
        jwt.sign = jest.fn().mockReturnValue('jwt_token');

        const req = {
            body: {
                email: 'mai@gmail.com',
                password: '12345678'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await login(req, res, next);
        expect(User.findOne).toHaveBeenCalledWith({ email: 'mai@gmail.com' });

        // Kiểm tra bcrypt so sánh đúng password gửi lên và password mã hóa từ DB
        expect(bcrypt.compare).toHaveBeenCalledWith('12345678', 'hashedPassword');
        expect(jwt.sign).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({
            message: "Login successful.",
            token: 'jwt_token'
        });
        expect(res.json).toHaveBeenCalled(); // Đảm bảo có trả dữ liệu/token về cho client
    });

    // 2. Wrong password
    test('Wrong password', async () => {
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                email: 'mai@gmail.com', password: 'hash'
            })
        });
        bcrypt.compare.mockResolvedValue(false);

        const req = {
            body: {
                email: 'mai@gmail.com',
                password: 'wrong'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await login(req, res, next);

        expect(next).toHaveBeenCalled();
        const errorPasses = next.mock.calls[0][0];
        expect(errorPasses.message).toBe("Incorrect password.");
    });

    // 3. Email not exist
    test('Email not found', async () => {
        User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        const req = {
            body: {
                email: 'abc@gmail.com',
                password: '12345678'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const next = jest.fn();
        await login(req, res, next);

        expect(next).toHaveBeenCalled();
        // Lưu ý: Nếu user.controller của bạn dùng res.status(401).json(...) khi sai email, 
        // bạn cần đổi expect(next) thành expect(res.status).toHaveBeenCalledWith(401);
    });


});

describe('Register customer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Register success
    test('Register success', async () => {

        // Giả lập email chưa tồn tại (trả về null)
        User.findOne = jest.fn().mockResolvedValue(null);

        //   GIẢ LẬP ROLE
        Role.findOne = jest.fn().mockResolvedValue({
            _id: 'role123',
            name: 'online-customer'
        });

        // 3. Giả lập đầy đủ hàm của bcrypt
        bcrypt.genSalt = jest.fn().mockResolvedValue('salt123');
        bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

        // Giả lập User.create trả về dữ liệu tương thích với controller
        User.create = jest.fn().mockResolvedValue({
            _id: 'newUser123',
            fullName: 'New User',
            email: 'new@gmail.com',
            phone: '0123456789'
        });

        // Request dữ liệu giả lập gửi lên
        const req = {
            body: {
                fullName: 'New User',
                email: 'new@gmail.com',
                password: 'password123',
                phone: '0123456789',
                gender: 'male',
                dateOfBirth: '2000-01-01'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await register(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'new@gmail.com' });
        expect(Role.findOne).toHaveBeenCalledWith({ name: 'online-customer' });
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(User.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Register successfully. Check your email for OTP."
        }));
    });

    // 2. Email already exists, block
    test('Register failed - Email already exists, block', async () => {
        // Giả lập tìm thấy email đã tồn tại trong DB
        User.findOne = jest.fn().mockResolvedValue({
            email: 'blocked@gmail.com',
            status: "blocked",
            isEmailVerified: true,
        });

        const req = {
            body: {
                fullName: 'Blocked User',
                email: 'blocked@gmail.com',
                password: 'password123',
                phone: '0123456789'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        await register(req, res, next);
        //  Kiểm tra kết quả (Assertions)
        expect(User.findOne).toHaveBeenCalledWith({ email: 'blocked@gmail.com' });
        // Kiểm tra hàm next() có được gọi với đúng HttpError 422 không
        expect(next).toHaveBeenCalled();
        // check erorr 403 and nofitication
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.statusCode).toBe(403);
        expect(errorPassed.message).toBe("This account cannot be registered again.");
        // ĐẢM BẢO: Không tìm kiếm Role hay tạo User mới
        expect(Role.findOne).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    // 3. Email already exists, unverified 
    test('Register failed - Email already exists, pending and unverified', async () => {
        User.findOne = jest.fn().mockResolvedValue({
            _id: 'pendingUser123',
            email: 'pending@gmail.com',
            status: 'pending',
            isEmailVerified: false
        });

        Role.findOne = jest.fn().mockResolvedValue({
            _id: 'role123',
            name: 'online-customer'
        });

        bcrypt.genSalt = jest.fn().mockResolvedValue('salt123');
        bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

        User.findByIdAndUpdate = jest.fn().mockResolvedValue({
            _id: 'pendingUser123',
            fullName: 'Updated Name',
            email: 'pending@gmail.com',
            phone: '0987654321'
        });

        User.create = jest.fn();

        const req = {
            body: {
                fullName: 'Updated Name',
                email: 'pending@gmail.com',
                password: 'newpassword123',
                phone: '0987654321',
                gender: 'female',
                dateOfBirth: '1999-09-09'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await register(req, res, next);


        expect(User.findOne).toHaveBeenCalledWith({ email: 'pending@gmail.com' });
        expect(Role.findOne).toHaveBeenCalledWith({ name: 'online-customer' });
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'pendingUser123',
            expect.any(Object),
            { new: true }
        );

        expect(User.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Registration successful. Please check your email for the OTP.",
            type: "new"
        }));
        expect(next).not.toHaveBeenCalled();
    });


    // 4. Email already exists, active
    test('Register failed - Email already exists, active', async () => {
        // Giả lập tìm thấy email đã tồn tại trong DB
        User.findOne = jest.fn().mockResolvedValue({
            email: 'new@gmail.com',
            status: "active"
        });

        const req = {
            body: {
                email: 'new@gmail.com',
                password: 'password123'
            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await register(req, res, next);

        // Kiểm tra hàm next() có được gọi với đúng HttpError 422 không
        expect(next).toHaveBeenCalled();
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.statusCode).toBe(422); // Hoặc errorPassed.code tùy thuộc vào class HttpError của bạn
        expect(errorPassed.message).toBe("An account with this email already exists. Please log in instead.");
    });

});

//describe('Forgot password', () => {
//     beforeEach(() => { jest.clearAllMocks(); });

//     // 1. Email tồn tại
//     test('Send OTP success', async () => {
//         User.findOne.mockResolvedValue({
//             email: 'mai@gmail.com',
//             status: 'active'
//         });
//         bcrypt.genSalt.mockResolvedValue('salt');
//         bcrypt.hash.mockResolvedValue('otpHash');
//         sendEmailVerification.mockResolvedValue(true);
//         await forgotPassword(req, res, next);

//         expect(sendEmailVerification).toHaveBeenCalled();
//         expect(res.status).toHaveBeenCalledWith(200);

//     });

//     // 2. Email không tồn tại
//     test('Email not found', async () => {
//         // Giả lập không tìm thấy user mang email này
//         User.findOne = jest.fn().mockResolvedValue(null);
//         const req = { body: { email: 'notfound@gmail.com' } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//         const next = jest.fn();

//         await forgotPassword(req, res, next);

//         expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@gmail.com' });
//         // Mong đợi hàm next(error) được gọi vì lỗi không tìm thấy người dùng
//         expect(next).toHaveBeenCalled();
//     });

//     // 3. Account pending verify

//     // 4. Email rỗng/null

//     // 5. Email format sai

//     // 6. Generate OTP thành công


//     // 7. Hash OTP thành công

//     // 8. Send email thành công
//     test('Send forgot password request success', async () => {
//         // Giả lập tìm thấy user hợp lệ
//         const mockUser = {
//             email: 'mai@gmail.com',
//             save: jest.fn().mockResolvedValue(true) // Giả lập lưu token/OTP vào DB
//         };
//         User.findOne = jest.fn().mockResolvedValue(mockUser);

//         const req = { body: { email: 'mai@gmail.com' } };
//         const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//         const next = jest.fn();

//         await forgotPassword(req, res, next);

//         expect(User.findOne).toHaveBeenCalledWith({ email: 'mai@gmail.com' });
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalled(); // Mong đợi thông báo gửi mã/reset link thành công
//     });


//     // 9. OTP sai
//     test('Wrong OTP', async () => {
//         User.findOne.mockResolvedValue({ otpCode: 'hash' });
//         bcrypt.compare.mockResolvedValue(false);
//         await verifyOTP(req, res, next);
//         expect(next).toHaveBeenCalled();

//     });


//     // 10. OTP hết hạn

//     // 11. OTP null

//     // 12. OTP đã dùng rồi

//     // 13. Password mới hợp lệ

//     // 14. Password quá ngắn


//     // 15. Confirm password mismatch

//     // 16. Reset thành công
//     test(
//         'Reset password success', async () => {
//             User.findOne.mockResolvedValue({
//                 otpCode: 'hash',
//                 otpExpires: new Date(Date.now() + 10000)
//             });

//             bcrypt.compare.mockResolvedValue(true);
//             bcrypt.hash.mockResolvedValue('newHash');

//             await resetPassword(req, res, next);

//             expect(User.findByIdAndUpdate).toHaveBeenCalled();

//         });
// });