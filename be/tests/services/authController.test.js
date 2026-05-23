// tests/controllers/login.test.js

const User = require('../../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { login, register, forgotPassword } = require('../../controllers/user.controller');

jest.mock('../../models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
// Giả lập gửi email luôn thành công để test không bị crash
jest.mock('../../services/email.service', () => jest.fn().mockResolvedValue(true));

describe('Login customer', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    //1. Login success
    test('Login success', async () => {
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user123',
                email: 'mai@gmail.com',
                password: 'hashedPassword',
                roles: ['customer']
            })
        });

        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('jwt_token');
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
        expect(res.status).toHaveBeenCalledWith(200);
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
        // Tương tự, nếu controller trả trực tiếp mã lỗi thay vì đẩy qua next(error):
        // expect(res.status).toHaveBeenCalledWith(401);
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
    beforeEach(() => { jest.clearAllMocks(); });

    // 1. Register success
    test('Register success', async () => {
        // Giả lập email chưa tồn tại (trả về null)
        User.findOne = jest.fn().mockResolvedValue(null);
        bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword'); // Giả lập hàm hash mật khẩu
        User.create = jest.fn().mockResolvedValue({
            _id: 'newUser123',
            email: 'new@gmail.com',
            roles: ['customer']
        });

        const req = { body: { email: 'new@gmail.com', password: 'password123', name: 'New User' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await register(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'new@gmail.com' });
        expect(bcrypt.hash).toHaveBeenCalled();
        expect(User.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201); // Hoặc 200 tuỳ vào logic response của hàm controller của bạn
    }); // Tăng timeout lên 10000ms (10s)

    // 2. Email already exists, active
    test('Email already exists', async () => {
        // Giả lập tìm thấy email đã tồn tại trong DB
        User.findOne = jest.fn().mockResolvedValue({ email: 'mai@gmail.com' });

        const req = { body: { email: 'mai@gmail.com', password: 'password123' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await register(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'mai@gmail.com' });
        expect(next).toHaveBeenCalled(); // Giả định khi có lỗi sẽ đẩy sang next(error)
    }); // Tăng timeout lên 10000ms (10s)

    // 3. Email already exists, pending chưa verify

});

describe('Forgot password', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    // 1. Email tồn tại
    test('Send OTP success', async () => {
        User.findOne.mockResolvedValue({
            email: 'mai@gmail.com',
            status: 'active'
        });
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('otpHash');
        sendEmailVerification.mockResolvedValue(true);
        await forgotPassword(req, res, next);

        expect(sendEmailVerification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);

    });

    // 2. Email không tồn tại
    test('Email not found', async () => {
        // Giả lập không tìm thấy user mang email này
        User.findOne = jest.fn().mockResolvedValue(null);
        const req = { body: { email: 'notfound@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@gmail.com' });
        // Mong đợi hàm next(error) được gọi vì lỗi không tìm thấy người dùng
        expect(next).toHaveBeenCalled();
    });

    // 3. Account pending verify

    // 4. Email rỗng/null

    // 5. Email format sai

    // 6. Generate OTP thành công


    // 7. Hash OTP thành công

    // 8. Send email thành công
    test('Send forgot password request success', async () => {
        // Giả lập tìm thấy user hợp lệ
        const mockUser = {
            email: 'mai@gmail.com',
            save: jest.fn().mockResolvedValue(true) // Giả lập lưu token/OTP vào DB
        };
        User.findOne = jest.fn().mockResolvedValue(mockUser);

        const req = { body: { email: 'mai@gmail.com' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'mai@gmail.com' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled(); // Mong đợi thông báo gửi mã/reset link thành công
    });


    // 9. OTP sai
    test('Wrong OTP', async () => {
        User.findOne.mockResolvedValue({ otpCode: 'hash' });
        bcrypt.compare.mockResolvedValue(false);
        await verifyOTP(req, res, next);
        expect(next).toHaveBeenCalled();

    });


    // 10. OTP hết hạn

    // 11. OTP null

    // 12. OTP đã dùng rồi

    // 13. Password mới hợp lệ

    // 14. Password quá ngắn


    // 15. Confirm password mismatch

    // 16. Reset thành công
    test(
        'Reset password success', async () => {
            User.findOne.mockResolvedValue({
                otpCode: 'hash',
                otpExpires: new Date(Date.now() + 10000)
            });

            bcrypt.compare.mockResolvedValue(true);
            bcrypt.hash.mockResolvedValue('newHash');

            await resetPassword(req, res, next);

            expect(User.findByIdAndUpdate).toHaveBeenCalled();

        });
});