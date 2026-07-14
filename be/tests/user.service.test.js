const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');

process.env.JWT_SECRET = 'test_jwt_secret';


let mockData = {};
let bcryptCompareResult = true;
let bcryptHashImpl = async (val) => `hashed_${val}`;
let jwtSignResult = 'mocked_jwt_token';
let sendEmailCalledWith = null;
let uploadImageResult = null;
let fsUnlinkCalledWith = null;

const UserMock = function (data) { Object.assign(this, data); };

UserMock.findOne = async (filter) => {
    if (mockData._userFindOneQueue && mockData._userFindOneQueue.length > 0) {
        const item = mockData._userFindOneQueue.shift();
        if (typeof item === 'function') return item(filter);
        return item;
    }
    if (filter && filter.email !== undefined) {
        return mockData.userByEmail !== undefined ? mockData.userByEmail : (mockData.user || null);
    }
    return mockData.user || null;
};

UserMock.findById = (id) => {
    mockData.userFindByIdCalledWith = id;
    if (mockData.userFindByIdChain) return { populate: async () => mockData.userFindByIdChain };
    return { populate: async () => mockData.user || null };
};

UserMock.find = (query) => {
    mockData.userFindCalledWith = query;
    if (query && query.$or && mockData.userList) {
        const searchRegexes = query.$or.map(cond => {
            const key = Object.keys(cond)[0];
            const val = cond[key];
            const pattern = typeof val === 'object' && val.$regex ? val.$regex : '';
            return { key, regex: new RegExp(pattern, 'i') };
        });
        const filtered = mockData.userList.filter(u => {
            return searchRegexes.some(({ key, regex }) => regex.test(u[key] || ''));
        });
        return { populate: async () => filtered };
    }
    return { populate: async () => mockData.userList || [] };
};

UserMock.create = async (data) => {
    mockData.userCreateCalledWith = data;
    return mockData.createdUser || { _id: 'new_user_id', ...data };
};

UserMock.findByIdAndUpdate = async (id, data, opts) => {
    mockData.userFindByIdAndUpdateCalledWith = { id, data, opts };
    return mockData.updatedUser || null;
};

const RoleMock = function (data) { Object.assign(this, data); };
RoleMock.findOne = async (filter) => {
    mockData.roleFindOneFilter = filter;
    return mockData.role || null;
};

const bcryptMock = {
    genSalt: async () => 'salt',
    hash: async (val, salt) => bcryptHashImpl(val, salt),
    compare: async (plain, hashed) => bcryptCompareResult,
};

const jwtMock = {
    sign: (payload, secret, opts) => {
        mockData.jwtSignCalledWith = { payload, secret, opts };
        return jwtSignResult;
    },
    verify: (token, secret) => ({ id: 'user_123', email: 'test@example.com' }),
};

const sendEmailMock = async (opts) => { sendEmailCalledWith = opts; return true; };

const cloudinaryMock = {
    uploadImage: async (path) => { mockData.uploadImagePath = path; return uploadImageResult || 'http://cloudinary.com/avatar.png'; },
};

const fsMock = {
    unlinkSync: (path) => { fsUnlinkCalledWith = path; },
};

mock('../models/user.model', UserMock);
mock('../models/role.model', RoleMock);
mock('bcryptjs', bcryptMock);
mock('jsonwebtoken', jwtMock);
mock('../services/email.service', sendEmailMock);
mock('../services/cloudinary.service', cloudinaryMock);
mock('fs', fsMock);

const userService = require('../services/user.service');
const HttpError = require('../models/http-error.model');

function resetAll() {
    mockData = { _userFindOneQueue: [] };
    bcryptCompareResult = true;
    bcryptHashImpl = async (val) => `hashed_${val}`;
    jwtSignResult = 'mocked_jwt_token';
    sendEmailCalledWith = null;
    uploadImageResult = null;
    fsUnlinkCalledWith = null;
}

describe('Login', () => {
    beforeEach(() => {
        resetAll();
        mockData.user = {
            _id: 'mock_user_id',
            email: 'test@example.com',
            password: 'hashed_password',
            fullName: 'John Doe',
            status: 'active',
            isEmailVerified: true,
            role: { name: 'online-customer' },
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = (filter) => ({
            select: function () { return this; },
            populate: async () => mockData.user,
        });
    });

    test('Account not found', async () => {
        UserMock.findOne = (filter) => ({
            select: function () { return this; },
            populate: async () => null,
        });

        await assert.rejects(
            async () => userService.login('notfound@example.com', 'password123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Account is blocked', async () => {
        mockData.user.status = 'blocked';

        await assert.rejects(
            async () => userService.login('blocked@example.com', 'password123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Account pending and email not verified → resend OTP, return isPending', async () => {
        mockData.user.status = 'pending';
        mockData.user.isEmailVerified = false;

        const result = await userService.login('test@example.com', 'password123');

        assert.deepStrictEqual(result, { isPending: true, email: 'test@example.com' });
        assert.ok(mockData.user._saved);
        assert.ok(sendEmailCalledWith);
        assert.ok(sendEmailCalledWith.to, 'test@example.com');
    });

    test('Active + verified account → return JWT token', async () => {
        const result = await userService.login('test@example.com', 'password123');

        assert.deepStrictEqual(result, { token: 'mocked_jwt_token' });
        assert.deepStrictEqual(mockData.jwtSignCalledWith.payload, { id: 'mock_user_id', email: 'test@example.com', role: 'online-customer' });
        assert.strictEqual(mockData.jwtSignCalledWith.secret, 'test_jwt_secret');
    });

    test('Wrong password', async () => {
        bcryptCompareResult = false;

        await assert.rejects(
            async () => userService.login('test@example.com', 'wrong_password'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 401); return true; }
        );
    });
});

describe('Register', () => {
    beforeEach(() => {
        resetAll();
        mockData.role = { _id: 'role_customer_id', name: 'online-customer' };
        UserMock.findOne = async (filter) => null;
        mockData.createdUser = { _id: 'new_user_id', fullName: 'Alice', email: 'new@example.com', phone: '0987654321' };
    });

    test('Email already exists (active)', async () => {
        UserMock.findOne = async (filter) => {
            if (filter.email) return { status: 'active' };
            return null;
        };

        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'active@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 422); return true; }
        );
    });

    test('Email already exists (blocked + verified)', async () => {
        UserMock.findOne = async (filter) => {
            if (filter.email) return { status: 'blocked', isEmailVerified: true };
            return null;
        };

        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'blocked@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Email exists (pending + unverified) → update existing user, send OTP', async () => {
        const existUser = { _id: 'existing_user_id', email: 'pending@example.com', status: 'pending', isEmailVerified: false };
        let findOneCount = 0;
        UserMock.findOne = async (filter) => {
            findOneCount++;
            if (filter.email) return existUser;
            return null; // phone check
        };
        mockData.updatedUser = { _id: 'existing_user_id', fullName: 'Alice Updated', email: 'pending@example.com', phone: '0987654321' };

        const result = await userService.register({ fullName: 'Alice Updated', email: 'pending@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' });

        assert.strictEqual(result.type, 'new');
        assert.strictEqual(result.user.id, 'existing_user_id');
        assert.ok(sendEmailCalledWith);
        assert.ok(mockData.userFindByIdAndUpdateCalledWith);
    });

    test('Phone number already exists (active)', async () => {
        let count = 0;
        UserMock.findOne = async (filter) => {
            count++;
            if (filter.email) return null;
            if (filter.phone) return { _id: 'another_user_id', status: 'active' };
            return null;
        };

        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 422); return true; }
        );
    });

    test('Role not found', async () => {
        mockData.role = null;

        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Successful registration → new user created, OTP sent', async () => {
        const result = await userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' });

        assert.strictEqual(result.type, 'new');
        assert.strictEqual(result.user.id, 'new_user_id');
        assert.ok(mockData.userCreateCalledWith);
        assert.strictEqual(mockData.userCreateCalledWith.email, 'new@example.com');
        assert.ok(sendEmailCalledWith);
        assert.strictEqual(result.remainingTime, 10 * 60 * 1000);
        assert.strictEqual(result.nextResendIn, 60 * 1000);
    });

    test('Phone already exists (separate call)', async () => {
        let count = 0;
        UserMock.findOne = async (filter) => {
            count++;
            if (filter.email) return { _id: 'email_user_id', status: 'pending' };
            if (filter.phone) return { _id: 'phone_user_id', status: 'active' };
            return null;
        };

        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 422); return true; }
        );
    });

    test('Registration fails if date of birth is in the future', async () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // tomorrow
        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female', dateOfBirth: futureDate }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.strictEqual(err.message, 'Ngày sinh không thể ở trong tương lai.');
                return true;
            }
        );
    });

    test('Registration fails if phone is missing', async () => {
        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', password: 'password123', gender: 'female', dateOfBirth: '2000-01-01' }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.strictEqual(err.message, 'Số điện thoại không được để trống.');
                return true;
            }
        );
    });

    test('Registration fails if gender is missing', async () => {
        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', dateOfBirth: '2000-01-01' }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.strictEqual(err.message, 'Giới tính không được để trống.');
                return true;
            }
        );
    });

    test('Registration fails if date of birth is missing', async () => {
        await assert.rejects(
            async () => userService.register({ fullName: 'Alice', email: 'new@example.com', phone: '0987654321', password: 'password123', gender: 'female' }),
            (err) => {
                assert.ok(err instanceof HttpError);
                assert.strictEqual(err.statusCode, 400);
                assert.strictEqual(err.message, 'Ngày sinh không được để trống.');
                return true;
            }
        );
    });
});

describe('Forgot Password', () => {
    beforeEach(() => {
        resetAll();
        mockData.user = {
            _id: 'mock_user_id',
            email: 'test@example.com',
            fullName: 'John Doe',
            status: 'active',
            isEmailVerified: true,
            resetPasswordToken: null,
            resetPasswordExpire: null,
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = async () => mockData.user;
    });

    test('Email not found', async () => {
        UserMock.findOne = async () => null;

        await assert.rejects(
            async () => userService.forgotPassword('nonexistent@example.com'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 200); return true; }
        );
    });

    test('Email not verified', async () => {
        mockData.user.isEmailVerified = false;

        await assert.rejects(
            async () => userService.forgotPassword('unverified@example.com'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Account blocked', async () => {
        mockData.user.status = 'blocked';

        await assert.rejects(
            async () => userService.forgotPassword('blocked@example.com'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Successful forgot password → sets token, sends email', async () => {
        await userService.forgotPassword('test@example.com');

        assert.ok(mockData.user._saved);
        assert.ok(mockData.user.resetPasswordToken);
        assert.ok(mockData.user.resetPasswordExpire);
        assert.ok(sendEmailCalledWith);
        assert.ok(sendEmailCalledWith.subject.includes('Đặt lại mật khẩu'));
    });
});

describe('Reset Password', () => {
    beforeEach(() => {
        resetAll();
        mockData.user = {
            _id: 'mock_user_id',
            email: 'test@example.com',
            password: 'old_hashed_password',
            resetPasswordToken: 'hashed_token',
            resetPasswordExpire: Date.now() + 15 * 60 * 1000,
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = async () => mockData.user;
    });

    test('Invalid or expired token', async () => {
        UserMock.findOne = async () => null;

        await assert.rejects(
            async () => userService.resetPassword('invalid_token', 'new_password123'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Successful reset password', async () => {
        await userService.resetPassword('valid_token', 'new_password123');

        assert.strictEqual(mockData.user.password, 'hashed_new_password123');
        assert.strictEqual(mockData.user.resetPasswordToken, null);
        assert.strictEqual(mockData.user.resetPasswordExpire, null);
        assert.ok(mockData.user._saved);
    });

    test('Missing password field', async () => {
        await userService.resetPassword('valid_token', undefined);
        assert.ok(mockData.user._saved);
    });
});

describe('updateUsers', () => {
    beforeEach(() => {
        resetAll();
        mockData.role = { _id: 'role_staff_id', name: 'staff' };
        mockData.updatedUser = { _id: '507f1f77bcf86cd799439011', fullName: 'Customer User', email: 'customer@example.com', role: 'role_staff_id', status: 'active' };
        UserMock.findOne = async () => null; // no email/phone conflict by default
    });

    test('Invalid user ID', async () => {
        await assert.rejects(
            async () => userService.updateUsers('invalid-id', { role: 'staff' }, '507f1f77bcf86cd799439012'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Updating own role/status', async () => {
        const userId = '507f1f77bcf86cd799439011';
        await assert.rejects(
            async () => userService.updateUsers(userId, { role: 'staff' }, userId),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Role not found', async () => {
        mockData.role = null;

        await assert.rejects(
            async () => userService.updateUsers('507f1f77bcf86cd799439011', { role: 'non-existent' }, '507f1f77bcf86cd799439012'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Try to assign owner role', async () => {
        mockData.role = { name: 'owner' };

        await assert.rejects(
            async () => userService.updateUsers('507f1f77bcf86cd799439011', { role: 'owner' }, '507f1f77bcf86cd799439012'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 403); return true; }
        );
    });

    test('Email already in use by another user', async () => {
        UserMock.findOne = async (filter) => {
            if (filter.email) return { _id: 'another_user_id', email: 'taken@example.com' };
            return null;
        };

        await assert.rejects(
            async () => userService.updateUsers('507f1f77bcf86cd799439011', { email: 'taken@example.com', role: 'staff' }, '507f1f77bcf86cd799439012'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Phone already in use by another user', async () => {
        UserMock.findOne = async (filter) => {
            if (filter.email) return null;
            if (filter.phone) return { _id: 'another_user_id', phone: '0987654321' };
            return null;
        };

        await assert.rejects(
            async () => userService.updateUsers('507f1f77bcf86cd799439011', { phone: '0987654321', role: 'staff' }, '507f1f77bcf86cd799439012'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
        );
    });

    test('Successful role update (customer → staff)', async () => {
        const result = await userService.updateUsers('507f1f77bcf86cd799439011', { fullName: 'Customer User', email: 'customer@example.com', phone: '0987654321', role: 'staff', status: 'active' }, '507f1f77bcf86cd799439012');

        assert.deepStrictEqual(result, mockData.updatedUser);
        assert.strictEqual(mockData.roleFindOneFilter.name, 'staff');
        assert.strictEqual(mockData.userFindByIdAndUpdateCalledWith.data.role, 'role_staff_id');
    });

    test('Successful update with avatar file upload', async () => {
        uploadImageResult = 'http://cloudinary.com/new_avatar.png';

        await userService.updateUsers('507f1f77bcf86cd799439011', { fullName: 'Customer User', role: 'staff', file: { path: 'temp/avatar.png' } }, '507f1f77bcf86cd799439012');

        assert.strictEqual(mockData.uploadImagePath, 'temp/avatar.png');
        assert.strictEqual(fsUnlinkCalledWith, 'temp/avatar.png');
        assert.strictEqual(mockData.userFindByIdAndUpdateCalledWith.data.avatar, 'http://cloudinary.com/new_avatar.png');
    });
});

describe('Addresses Flow', () => {
    const email = 'test@example.com';
    const addressData = {
        receiverName: 'John Doe',
        receiverPhone: '0987654321',
        province: 'Ha Noi',
        provinceId: 201,
        district: 'Cau Giay',
        districtId: 2001,
        ward: 'Dich Vong',
        wardCode: '200101',
        addressDetail: 'So 1 Duy Tan',
        note: 'Giao gio hanh chinh',
        isDefault: false,
    };

    beforeEach(() => {
        resetAll();
        mockData.user = {
            _id: 'user_123',
            email,
            addresses: [],
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = async () => mockData.user;
    });

    describe('createAddress', () => {
        test('User not found → throws 404', async () => {
            UserMock.findOne = async () => null;
            await assert.rejects(
                async () => userService.createAddress(email, addressData),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('First address → automatically set isDefault=true', async () => {
            const result = await userService.createAddress(email, addressData);
            assert.strictEqual(mockData.user.addresses.length, 1);
            assert.strictEqual(mockData.user.addresses[0].isDefault, true);
            assert.ok(mockData.user._saved);
            assert.strictEqual(result.receiverName, 'John Doe');
        });

        test('New isDefault address', async () => {
            mockData.user.addresses = [
                { _id: { toString: () => 'addr_1' }, isDefault: true },
                { _id: { toString: () => 'addr_2' }, isDefault: false },
            ];

            const result = await userService.createAddress(email, { ...addressData, isDefault: true });

            assert.strictEqual(mockData.user.addresses.length, 3);
            assert.strictEqual(mockData.user.addresses[0].isDefault, false);
            assert.strictEqual(mockData.user.addresses[1].isDefault, false);
            assert.strictEqual(mockData.user.addresses[2].isDefault, true);
            assert.ok(mockData.user._saved);
        });
    });

    describe('getAllAddresses', () => {
        test('User not found → throws 404', async () => {
            UserMock.findOne = async () => null;
            await assert.rejects(
                async () => userService.getAllAddresses(email),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Return all addresses successfully', async () => {
            mockData.user.addresses = [{ _id: 'addr_1', receiverName: 'Alice' }, { _id: 'addr_2', receiverName: 'Bob' }];

            const result = await userService.getAllAddresses(email);

            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].receiverName, 'Alice');
        });
    });

    describe('updateAddress', () => {
        test('User not found → throws 404', async () => {
            UserMock.findOne = async () => null;
            await assert.rejects(
                async () => userService.updateAddress(email, 'addr_1', addressData),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Address not found', async () => {
            await assert.rejects(
                async () => userService.updateAddress(email, 'addr_1', addressData),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Successfully update address and handle default switch', async () => {
            const existingAddress = { _id: 'addr_1', receiverName: 'Alice', isDefault: true, toString: () => 'addr_1' };
            const anotherAddress = { _id: 'addr_2', receiverName: 'Bob', isDefault: false, toString: () => 'addr_2' };
            mockData.user.addresses = [existingAddress, anotherAddress];

            const result = await userService.updateAddress(email, 'addr_2', { receiverName: 'Bob Updated', isDefault: true });

            assert.strictEqual(result.receiverName, 'Bob Updated');
            assert.strictEqual(mockData.user.addresses[0].isDefault, false);
            assert.strictEqual(mockData.user.addresses[1].isDefault, true);
            assert.ok(mockData.user._saved);
        });
    });

    describe('deleteAddress', () => {
        test('User not found', async () => {
            UserMock.findOne = async () => null;
            await assert.rejects(
                async () => userService.deleteAddress(email, 'addr_1'),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Address not found', async () => {
            await assert.rejects(
                async () => userService.deleteAddress(email, 'addr_1'),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Last address', async () => {
            mockData.user.addresses = [{ _id: 'addr_1', receiverName: 'Alice', toString: () => 'addr_1' }];

            await assert.rejects(
                async () => userService.deleteAddress(email, 'addr_1'),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 400); return true; }
            );
        });

        test('Delete default address → next address becomes default', async () => {
            const addr1 = { _id: 'addr_1', receiverName: 'Alice', isDefault: true, toString: () => 'addr_1' };
            const addr2 = { _id: 'addr_2', receiverName: 'Bob', isDefault: false, toString: () => 'addr_2' };
            mockData.user.addresses = [addr1, addr2];

            await userService.deleteAddress(email, 'addr_1');

            assert.strictEqual(mockData.user.addresses.length, 1);
            assert.strictEqual(mockData.user.addresses[0]._id, 'addr_2');
            assert.strictEqual(mockData.user.addresses[0].isDefault, true);
            assert.ok(mockData.user._saved);
        });
    });

    describe('findAddressById', () => {
        test('User not found', async () => {
            UserMock.findOne = async () => null;
            await assert.rejects(
                async () => userService.findAddressById(email, 'addr_1'),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Address not found', async () => {
            await assert.rejects(
                async () => userService.findAddressById(email, 'addr_1'),
                (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
            );
        });

        test('Return matching address successfully', async () => {
            const address = { _id: 'addr_1', receiverName: 'Alice', toString: () => 'addr_1' };
            mockData.user.addresses = [address];

            const result = await userService.findAddressById(email, 'addr_1');

            assert.deepStrictEqual(result, address);
        });
    });
});


describe('getMyProfile', () => {
    beforeEach(() => { resetAll(); });

    test('User not found', async () => {
        UserMock.findOne = () => ({ populate: async () => null });

        await assert.rejects(
            async () => userService.getMyProfile('nonexistent@example.com'),
            (err) => { assert.ok(err instanceof HttpError); assert.strictEqual(err.statusCode, 404); return true; }
        );
    });

    test('Return user profile details successfully', async () => {
        const mockUserObj = { _id: 'user_123', fullName: 'John Doe', email: 'john@example.com', phone: '0987654321', gender: 'male', dateOfBirth: '1990-01-01', provider: 'local', role: { name: 'online-customer' }, avatar: 'avatar.png', addresses: [], balance: 1000 };
        UserMock.findOne = () => ({ populate: async () => mockUserObj });

        const result = await userService.getMyProfile('john@example.com');

        assert.deepStrictEqual(result, { id: 'user_123', fullName: 'John Doe', email: 'john@example.com', phone: '0987654321', gender: 'male', dateOfBirth: '1990-01-01', provider: 'local', role: 'online-customer', avatar: 'avatar.png', addresses: [], balance: 1000 });
    });
});

describe('getAllUsers', () => {
    beforeEach(() => { resetAll(); });

    test('Return all users successfully', async () => {
        mockData.userList = [
            { _id: 'user_1', fullName: 'Alice', email: 'alice@example.com', phone: '111111', avatar: 'avatar1.png', status: 'active', role: { name: 'online-customer' }, createdAt: '2026-07-01', updatedAt: '2026-07-02' },
            { _id: 'user_2', fullName: 'Bob', email: 'bob@example.com', phone: '222222', avatar: 'avatar2.png', status: 'blocked', role: { name: 'staff' }, createdAt: '2026-07-03', updatedAt: '2026-07-04' },
        ];

        const result = await userService.getAllUsers();

        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(result[0], { id: 'user_1', fullName: 'Alice', email: 'alice@example.com', phone: '111111', avatar: 'avatar1.png', status: 'active', role: 'online-customer', createdAt: '2026-07-01', updatedAt: '2026-07-02' });
        assert.deepStrictEqual(result[1], { id: 'user_2', fullName: 'Bob', email: 'bob@example.com', phone: '222222', avatar: 'avatar2.png', status: 'blocked', role: 'staff', createdAt: '2026-07-03', updatedAt: '2026-07-04' });
    });

    test('Search users by name (partial match)', async () => {
        mockData.userList = [
            { _id: 'user_1', fullName: 'Alice Smith', email: 'alice@example.com', phone: '111111', avatar: 'avatar1.png', status: 'active', role: { name: 'online-customer' }, createdAt: '2026-07-01', updatedAt: '2026-07-02' },
            { _id: 'user_2', fullName: 'Bob Jones', email: 'bob@example.com', phone: '222222', avatar: 'avatar2.png', status: 'blocked', role: { name: 'staff' }, createdAt: '2026-07-03', updatedAt: '2026-07-04' },
        ];

        const result = await userService.getAllUsers('Alice');

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].fullName, 'Alice Smith');
        assert.deepStrictEqual(mockData.userFindCalledWith, {
            $or: [
                { fullName: { $regex: 'Alice', $options: 'i' } },
                { email: { $regex: 'Alice', $options: 'i' } }
            ]
        });
    });

    test('Search users by email (partial match)', async () => {
        mockData.userList = [
            { _id: 'user_1', fullName: 'Alice Smith', email: 'alice@example.com', phone: '111111', avatar: 'avatar1.png', status: 'active', role: { name: 'online-customer' }, createdAt: '2026-07-01', updatedAt: '2026-07-02' },
            { _id: 'user_2', fullName: 'Bob Jones', email: 'bob@example.com', phone: '222222', avatar: 'avatar2.png', status: 'blocked', role: { name: 'staff' }, createdAt: '2026-07-03', updatedAt: '2026-07-04' },
        ];

        const result = await userService.getAllUsers('bob@ex');

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].fullName, 'Bob Jones');
        assert.deepStrictEqual(mockData.userFindCalledWith, {
            $or: [
                { fullName: { $regex: 'bob@ex', $options: 'i' } },
                { email: { $regex: 'bob@ex', $options: 'i' } }
            ]
        });
    });
});

describe('verifyOtp', () => {
    beforeEach(() => {
        resetAll();
        mockData.existUser = {
            _id: 'user_123', fullName: 'John Doe', email: 'john@example.com', phone: '0987654321',
            status: 'pending', isEmailVerified: false,
            otpCode: 'hashed_otp',
            otpExpires: new Date(Date.now() + 10 * 60 * 1000),
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = () => ({ select: async () => mockData.existUser });
    });

    test('User not found', async () => {
        UserMock.findOne = () => ({ select: async () => null });
        await assert.rejects(async () => userService.verifyOtp('nonexistent@example.com', '123456'), (err) => { assert.strictEqual(err.statusCode, 404); return true; });
    });

    test('Already active and verified', async () => {
        mockData.existUser.status = 'active';
        mockData.existUser.isEmailVerified = true;
        await assert.rejects(async () => userService.verifyOtp('john@example.com', '123456'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('User is blocked', async () => {
        mockData.existUser.status = 'blocked';
        await assert.rejects(async () => userService.verifyOtp('john@example.com', '123456'), (err) => { assert.strictEqual(err.statusCode, 403); return true; });
    });

    test('OTP code is missing', async () => {
        mockData.existUser.otpCode = null;
        await assert.rejects(async () => userService.verifyOtp('john@example.com', '123456'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('OTP expired', async () => {
        mockData.existUser.otpExpires = new Date(Date.now() - 1000);
        await assert.rejects(async () => userService.verifyOtp('john@example.com', '123456'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('OTP invalid (bcrypt mismatch)', async () => {
        bcryptCompareResult = false;
        await assert.rejects(async () => userService.verifyOtp('john@example.com', 'wrongotp'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('Verify OTP successfully → user becomes active', async () => {
        const result = await userService.verifyOtp('john@example.com', '123456');

        assert.strictEqual(mockData.existUser.status, 'active');
        assert.strictEqual(mockData.existUser.isEmailVerified, true);
        assert.strictEqual(mockData.existUser.otpCode, null);
        assert.strictEqual(mockData.existUser.otpExpires, null);
        assert.ok(mockData.existUser._saved);
        assert.deepStrictEqual(result, { id: 'user_123', fullName: 'John Doe', email: 'john@example.com', phone: '0987654321', status: 'active' });
    });
});

describe('resendOtp', () => {
    beforeEach(() => {
        resetAll();
        mockData.existUser = {
            _id: 'user_123', fullName: 'John Doe', email: 'john@example.com',
            status: 'pending', isEmailVerified: false,
            otpCooldownUntil: null,
            save: async function () { this._saved = true; },
        };
        UserMock.findOne = () => ({ select: async () => mockData.existUser });
    });

    test('User not found', async () => {
        UserMock.findOne = () => ({ select: async () => null });
        await assert.rejects(async () => userService.resendOtp('nonexistent@example.com'), (err) => { assert.strictEqual(err.statusCode, 404); return true; });
    });

    test('Already active and verified', async () => {
        mockData.existUser.status = 'active';
        mockData.existUser.isEmailVerified = true;
        await assert.rejects(async () => userService.resendOtp('john@example.com'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('User is blocked', async () => {
        mockData.existUser.status = 'blocked';
        await assert.rejects(async () => userService.resendOtp('john@example.com'), (err) => { assert.strictEqual(err.statusCode, 403); return true; });
    });

    test('Resend before cooldown passes', async () => {
        mockData.existUser.otpCooldownUntil = new Date(Date.now() + 30 * 1000);
        await assert.rejects(async () => userService.resendOtp('john@example.com'), (err) => { assert.strictEqual(err.statusCode, 429); return true; });
    });

    test('Successfully resend OTP', async () => {
        await userService.resendOtp('john@example.com');

        assert.ok(mockData.existUser._saved);
        assert.ok(mockData.existUser.otpCode);
        assert.ok(mockData.existUser.otpExpires);
        assert.ok(mockData.existUser.otpCooldownUntil);
        assert.ok(sendEmailCalledWith);
        assert.ok(sendEmailCalledWith.subject.includes('Xác thực tài khoản'));
    });
});

describe('findUserById', () => {
    beforeEach(() => { resetAll(); });

    test('Invalid ID format', async () => {
        await assert.rejects(async () => userService.findUserById('invalid-id'), (err) => { assert.strictEqual(err.statusCode, 400); return true; });
    });

    test('User not found', async () => {
        UserMock.findById = () => ({ populate: async () => null });
        await assert.rejects(async () => userService.findUserById('507f1f77bcf86cd799439011'), (err) => { assert.strictEqual(err.statusCode, 404); return true; });
    });

    test('Return user successfully when found', async () => {
        const mockUserObj = { _id: '507f1f77bcf86cd799439011', fullName: 'Alice' };
        UserMock.findById = () => ({ populate: async () => mockUserObj });

        const result = await userService.findUserById('507f1f77bcf86cd799439011');
        assert.deepStrictEqual(result, mockUserObj);
    });
});

describe('updateMyProfile', () => {
    beforeEach(() => {
        resetAll();
        mockData.user = { _id: '507f1f77bcf86cd799439011', email: 'john@example.com', fullName: 'Old Name' };
        UserMock.findOne = async () => mockData.user;
    });

    test('User not found', async () => {
        UserMock.findOne = async () => null;
        await assert.rejects(async () => userService.updateMyProfile('nonexistent@example.com', { fullName: 'New Name' }), (err) => { assert.strictEqual(err.statusCode, 404); return true; });
    });

    test('Successfully update profile without file', async () => {
        mockData.updatedUser = { ...mockData.user, fullName: 'New Name' };

        const result = await userService.updateMyProfile('john@example.com', { fullName: 'New Name', gender: 'male', dateOfBirth: '1990-01-01' });

        assert.strictEqual(mockData.userFindByIdAndUpdateCalledWith.id, '507f1f77bcf86cd799439011');
        assert.strictEqual(mockData.userFindByIdAndUpdateCalledWith.data.fullName, 'New Name');
        assert.strictEqual(result.fullName, 'New Name');
    });

    test('Successfully update profile with file upload → uploadImage + unlinkSync called', async () => {
        uploadImageResult = 'http://cloudinary.com/my_new_avatar.png';
        mockData.updatedUser = { ...mockData.user, avatar: 'http://cloudinary.com/my_new_avatar.png' };

        await userService.updateMyProfile('john@example.com', { fullName: 'New Name', file: { path: 'temp/my_avatar.png' } });

        assert.strictEqual(mockData.uploadImagePath, 'temp/my_avatar.png');
        assert.strictEqual(fsUnlinkCalledWith, 'temp/my_avatar.png');
        assert.strictEqual(mockData.userFindByIdAndUpdateCalledWith.data.avatar, 'http://cloudinary.com/my_new_avatar.png');
    });
});
