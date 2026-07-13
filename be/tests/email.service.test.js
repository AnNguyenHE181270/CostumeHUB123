process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@costumehub.com';
process.env.SMTP_PASS = 'testpass';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mock = require('mock-require');

// ============================
// Mock nodemailer
// ============================

let mockSendMail;
let nodemailerMock;

beforeEach(() => {
    mockSendMail = async () => { throw new Error('mockSendMail not set'); };

    nodemailerMock = {
        createTransport: (config) => {
            nodemailerMock._lastConfig = config;
            return {
                sendMail: async (opts) => mockSendMail(opts),
            };
        },
        _lastConfig: null,
    };

    mock('nodemailer', nodemailerMock);
    mock.reRequire('../services/email.service');
});

afterEach(() => {
    mock.stopAll();
});

describe('emailService', () => {
    test('Create transporter with correct config from env', () => {
        // nodemailer.createTransport is called at module load time
        assert.deepStrictEqual(nodemailerMock._lastConfig, {
            host: 'smtp.test.com',
            port: 587,
            secure: false,
            auth: {
                user: 'test@costumehub.com',
                pass: 'testpass',
            },
        });
    });

    test('Send email successfully and return info object', async () => {
        const mockInfo = { messageId: 'mock-message-id' };
        mockSendMail = async () => mockInfo;

        const sendEmail = mock.reRequire('../services/email.service');

        const emailData = {
            to: 'recipient@test.com',
            subject: 'Test Subject',
            text: 'Test Text',
            html: '<p>Test HTML</p>',
        };

        const result = await sendEmail(emailData);

        assert.deepStrictEqual(result, mockInfo);
    });

    test('Throw error when sendMail fails', async () => {
        const mockError = new Error('SMTP connection error');
        mockSendMail = async () => { throw mockError; };

        const sendEmail = mock.reRequire('../services/email.service');

        const emailData = {
            to: 'recipient@test.com',
            subject: 'Test Subject',
            text: 'Test Text',
            html: '<p>Test HTML</p>',
        };

        await assert.rejects(
            async () => sendEmail(emailData),
            (err) => {
                assert.strictEqual(err.message, 'SMTP connection error');
                return true;
            }
        );
    });
});
