const userService = require('../services/user.service');
const User = require('../models/user.model');
const Role = require('../models/role.model');

const HttpError = require('../models/http-error.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');

// Mock dependencies
jest.mock('../models/user.model');
jest.mock('../models/role.model');
jest.mock('../services/email.service', () => jest.fn());
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Login', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_jwt_secret';

    // Default mock user object
    mockUser = {
      _id: 'mock_user_id',
      email: 'test@example.com',
      password: 'hashed_password',
      fullName: 'John Doe',
      status: 'active',
      isEmailVerified: true,
      role: { name: 'online-customer' },
      save: jest.fn().mockResolvedValue(this),
    };
  });

  test('1. Account is not found', async () => {
    // Setup Mock
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null),
    }));

    await expect(userService.login('notfound@example.com', 'password123'))
      .rejects
      .toThrow(new HttpError('User not found.', 404));

    expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
  });

  test('2. Account is blocked', async () => {
    // Setup Mock
    mockUser.status = 'blocked';
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockUser),
    }));

    await expect(userService.login('blocked@example.com', 'password123'))
      .rejects
      .toThrow(new HttpError('User is blocked.', 403));
  });


  test('3. Account is pending and email not verified', async () => {
    mockUser.status = 'pending';
    mockUser.isEmailVerified = false;

    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockUser),
    }));

    bcrypt.compare.mockResolvedValue(true);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed_otp');
    sendEmail.mockResolvedValue(true);

    const result = await userService.login('test@example.com', 'password123');
    expect(result).toEqual({ isPending: true, email: 'test@example.com' });
    expect(mockUser.save).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: expect.stringContaining('Xác thực tài khoản'),
    }));
  })

  test('4. Account is active and email verified', async () => {
    mockUser.status = 'active';
    mockUser.isEmailVerified = true;

    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockUser),
    }));
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocked_jwt_token');

    const result = await userService.login('test@example.com', 'password123');

    expect(result).toEqual({ token: 'mocked_jwt_token' });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'mock_user_id', email: 'test@example.com', role: 'online-customer' },
      'test_jwt_secret',
      { expiresIn: '7d' }
    );
  })

  test('5. Password is incorrect', async () => {
    User.findOne.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockUser),
    }));
    bcrypt.compare.mockResolvedValue(false);

    await expect(userService.login('test@example.com', 'wrong_password'))
      .rejects
      .toThrow(new HttpError('Incorrect password.', 401));

    expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
  });
});

describe('Register', () => {
  let mockRole;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = { _id: 'role_customer_id', name: 'online-customer' };
  });

  test('1. Email already exists with active status', async () => {
    User.findOne.mockResolvedValue({ status: 'active' });

    await expect(userService.register({
      fullName: 'Alice',
      email: 'active@example.com',
      password: 'password123'
    })).rejects.toThrow(new HttpError('An account with this email already exists. Please log in instead.', 422));

    expect(User.findOne).toHaveBeenCalledWith({ email: 'active@example.com' });
  });

  test('2. Email already exists, block', async () => {
    User.findOne.mockResolvedValue({ status: 'blocked', isEmailVerified: true });

    await expect(userService.register({
      fullName: 'Alice',
      email: 'blocked@example.com',
      password: 'password123'
    })).rejects.toThrow(new HttpError('This account cannot be registered again.', 403));
  });

  test('3. Email already exists, pending and unverified', async () => {
    const mockExistUser = {
      _id: 'existing_user_id',
      email: 'pending@example.com',
      status: 'pending',
      isEmailVerified: false
    };

    User.findOne.mockResolvedValue(mockExistUser);
    Role.findOne.mockResolvedValue(mockRole);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockImplementation((val) => Promise.resolve(`hashed_${val}`));
    sendEmail.mockResolvedValue(true);

    const mockUpdatedUser = {
      _id: 'existing_user_id',
      fullName: 'Alice Updated',
      email: 'pending@example.com',
      phone: '0987654321'
    };
    User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

    const result = await userService.register({
      fullName: 'Alice Updated',
      email: 'pending@example.com',
      phone: '0987654321',
      password: 'password123'
    });

    expect(result).toEqual({
      type: 'new',
      user: { id: 'existing_user_id', fullName: 'Alice Updated', email: 'pending@example.com', phone: '0987654321' },
      remainingTime: 10 * 60 * 1000,
      nextResendIn: 60 * 1000
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  test('4. Phone number already exists with active status', async () => {
    User.findOne.mockImplementation((query) => {
      if (query.email) return Promise.resolve(null);
      if (query.phone) return Promise.resolve({ _id: 'another_user_id', status: 'active' });
      return Promise.resolve(null);
    });

    await expect(userService.register({
      fullName: 'Alice',
      email: 'new@example.com',
      phone: '0987654321',
      password: 'password123'
    })).rejects.toThrow(new HttpError('An account with this phone number already exists.', 422));
  });

  test('5. Online customer role not found', async () => {
    User.findOne.mockResolvedValue(null);
    Role.findOne.mockResolvedValue(null); // Role not found

    await expect(userService.register({
      fullName: 'Alice',
      email: 'new@example.com',
      password: 'password123'
    })).rejects.toThrow(new HttpError('Online customer role not found', 404));

    expect(Role.findOne).toHaveBeenCalledWith({ name: 'online-customer' });
  });

  test('6. Successful registration - User is new', async () => {
    User.findOne.mockResolvedValue(null);
    Role.findOne.mockResolvedValue(mockRole);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockImplementation((val) => Promise.resolve(`hashed_${val}`));
    sendEmail.mockResolvedValue(true);

    const mockNewUser = {
      _id: 'new_user_id',
      fullName: 'Alice',
      email: 'new@example.com',
      phone: '0987654321'
    };
    User.create.mockResolvedValue(mockNewUser);

    const result = await userService.register({
      fullName: 'Alice',
      email: 'new@example.com',
      phone: '0987654321',
      password: 'password123',
      gender: 'female',
      dateOfBirth: '2000-01-01'
    });

    expect(result).toEqual({
      type: 'new',
      user: { id: 'new_user_id', fullName: 'Alice', email: 'new@example.com', phone: '0987654321' },
      remainingTime: 10 * 60 * 1000,
      nextResendIn: 60 * 1000
    });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Alice',
      email: 'new@example.com',
      password: 'hashed_password123',
      role: 'role_customer_id'
    }));
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe('Forgot Password', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: 'mock_user_id',
      email: 'test@example.com',
      fullName: 'John Doe',
      status: 'active',
      isEmailVerified: true,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      save: jest.fn().mockResolvedValue(this),
    };
  });

  test('1. Email not found', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(userService.forgotPassword('nonexistent@example.com'))
      .rejects
      .toThrow(new HttpError('If an account with this email exists, password reset instructions have been sent.', 200));

    expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
  });

  test('2. Email is not verified', async () => {
    mockUser.isEmailVerified = false;
    User.findOne.mockResolvedValue(mockUser);

    await expect(userService.forgotPassword('unverified@example.com'))
      .rejects
      .toThrow(new HttpError('Email is not verified. Please verify your email before resetting your password.', 403));
  });

  test('3. Account is blocked', async () => {
    mockUser.status = 'blocked';
    User.findOne.mockResolvedValue(mockUser);

    await expect(userService.forgotPassword('blocked@example.com'))
      .rejects
      .toThrow(new HttpError('Your account has been blocked. Please contact support for assistance.', 403));
  });

  test('4. Successful forgot password request', async () => {
    User.findOne.mockResolvedValue(mockUser);
    sendEmail.mockResolvedValue(true);

    await userService.forgotPassword('test@example.com');

    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.resetPasswordToken).toBeDefined();
    expect(mockUser.resetPasswordExpire).toBeDefined();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: expect.stringContaining('Đặt lại mật khẩu'),
    }));
  });
});

describe('Reset Password', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: 'mock_user_id',
      email: 'test@example.com',
      password: 'old_hashed_password',
      resetPasswordToken: 'hashed_token',
      resetPasswordExpire: Date.now() + 15 * 60 * 1000,
      save: jest.fn().mockResolvedValue(this),
    };
  });

  test('1. Invalid or expired token', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(userService.resetPassword('invalid_token', 'new_password123'))
      .rejects
      .toThrow(new HttpError('Invalid or expired token.', 400));
  });

  test('2. Successful reset password', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('new_hashed_password');

    await userService.resetPassword('valid_token', 'new_password123');

    expect(mockUser.password).toBe('new_hashed_password');
    expect(mockUser.resetPasswordToken).toBeNull();
    expect(mockUser.resetPasswordExpire).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('new_password123', 'salt');
  });
  test('3. Missing password field', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('mock_hashed_undefined');

    await userService.resetPassword('valid_token', undefined);

    expect(bcrypt.hash).toHaveBeenCalledWith(undefined, 'salt');
    expect(mockUser.save).toHaveBeenCalled();
  });
});
