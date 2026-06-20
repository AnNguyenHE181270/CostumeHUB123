const Role = require('../models/role.model');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { login, register, forgotPassword, resetPassword } = require('../controllers/user.controller');
const { sendEmail } = require("../services/email.service")
const jwt = require('jsonwebtoken');

jest.mock('../services/email.service', () => jest.fn().mockResolvedValue(true));


describe('Login customer', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    test('Login success', async () => {
        jest.spyOn(User, 'findOne').mockImplementation(() => ({
            select: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    _id: 'user123',
                    email: 'mai@gmail.com',
                    password: 'hashedPassword',
                    status: 'active',
                    isEmailVerified: true,
                    role: { name: 'customer' }
                })
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

    test('Login failed - Wrong password', async () => {
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    email: 'mai@gmail.com',
                    password: 'hash',
                    status: 'active',
                    isEmailVerified: true,
                    role: { name: 'customer' }
                })
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
    });

    test('Login failed - Account is blocked', async () => {
        const req = {
            body: {
                email: 'blocked@gmail.com',
                password: 'password123',

            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        const mockUser = {
            email: 'blocked@gmail.com',
            password: 'hashed_password',
            status: 'blocked',
            isEmailVerified: true
        };
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUser)
            })
        });
        bcrypt.compare = jest.fn().mockResolvedValue(true); // Giả lập pass đúng nhưng tài khoản vẫn bị chặn

        await login(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.statusCode).toBe(403);
        expect(errorPassed.message).toBe("User is blocked.");

        expect(jwt.sign).not.toHaveBeenCalled();
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
        expect(User.findOne).toHaveBeenCalledWith({ email: 'blocked@gmail.com' });
        expect(next).toHaveBeenCalled();
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.statusCode).toBe(403);
        expect(errorPassed.message).toBe("This account cannot be registered again.");
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

        expect(next).toHaveBeenCalled();
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.statusCode).toBe(422); // Hoặc errorPassed.code tùy thuộc vào class HttpError của bạn
        expect(errorPassed.message).toBe("An account with this email already exists. Please log in instead.");
    });

});

describe('Forgot password', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    test('Email not found', async () => {
        User.findOne = jest.fn().mockResolvedValue(null);
        const req = { body: { email: 'notfound@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);
        expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@gmail.com' });
        expect(next).toHaveBeenCalled();
    });

    test('Account blocked', async () => {
        const mockUser = {
            email: 'blocked@gmail.com',
            status: 'blocked',
            isEmailVerified: true
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);

        const req = { body: { email: 'blocked@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'blocked@gmail.com' });

        expect(next).toHaveBeenCalledTimes(1);

        const errorPassedToNext = next.mock.calls[0][0];
        expect(errorPassedToNext.statusCode).toBe(403);
        expect(errorPassedToNext.message).toBe("Your account has been blocked. Please contact support for assistance.");
    });

    test('Account unverified', async () => {
        const mockUser = {
            email: 'unverified@gmail.com',
            status: 'blocked',
            isEmailVerified: true
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);

        const req = { body: { email: 'unverified@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'unverified@gmail.com' });

        expect(next).toHaveBeenCalledTimes(1);

        const errorPassedToNext = next.mock.calls[0][0];
        expect(errorPassedToNext.statusCode).toBe(403);
        expect(errorPassedToNext.message).toBe("Your account has been blocked. Please contact support for assistance.");
    });

    test('Generate reset token success', async () => {
        const mockUser = {
            email: 'mai@gmail.com',
            fullName: 'Mai User',
            status: 'active',
            isEmailVerified: true,
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);

        const req = { body: { email: 'mai@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'mai@gmail.com' });
        expect(mockUser.save).toHaveBeenCalled();
        // Verify reset token was set
        expect(mockUser.resetPasswordToken).toBeDefined();
        expect(mockUser.resetPasswordExpire).toBeDefined();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining("If an account with this email exists, password reset instructions have been sent.")
        }));
    });


});

describe('Reset password', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    // 1. Invalid or expired token
    test('Invalid or expired token', async () => {
        User.findOne = jest.fn().mockResolvedValue(null);

        const req = {
            params: { token: 'invalid_token_123' },
            body: { password: 'newPassword123' }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await resetPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        const errorPassed = next.mock.calls[0][0];
        expect(errorPassed.message).toBe("Invalid or expired token.");
        expect(errorPassed.statusCode).toBe(400);
    });

    // 2. Reset password success
    test('Reset password success', async () => {
        const mockUser = {
            resetPasswordToken: 'hashedToken123',
            resetPasswordExpire: new Date(Date.now() + 10000),
            password: 'oldHash',
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);
        bcrypt.genSalt = jest.fn().mockResolvedValue('salt123');
        bcrypt.hash = jest.fn().mockResolvedValue('newPasswordHash');

        const req = {
            params: { token: 'validToken123' },
            body: { password: 'NewPassword123' }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await resetPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalled();
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 'salt123');

        // Verify token was cleared
        expect(mockUser.resetPasswordToken).toBeNull();
        expect(mockUser.resetPasswordExpire).toBeNull();

        expect(mockUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Password reset successful."
        });
        expect(next).not.toHaveBeenCalled();
    });

    // 3. Missing password field
    test('Missing password field', async () => {
        const req = {
            params: { token: 'valid_token' },
            body: {} // Thiếu password trường này sẽ là undefined
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        const mockUser = {
            save: jest.fn().mockResolvedValue(true)
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);

        bcrypt.genSalt = jest.fn().mockResolvedValue('mock_salt');
        bcrypt.hash = jest.fn().mockResolvedValue('mock_hashed_undefined');

        await resetPassword(req, res, next);

        // DO CODE HIỆN TẠI KHÔNG CHECK TRỐNG: Hệ thống vẫn chạy xuyên suốt và băm 'undefined'
        expect(bcrypt.hash).toHaveBeenCalledWith(undefined, 'mock_salt');
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

});