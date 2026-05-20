const request = require('supertest');
const app = require('../server');

// lệnh run test: npm run test

describe('GET /', () => {
    test('nên trả về trạng thái 200 và thông báo Server is running dưới dạng JSON', async () => {
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toEqual({
            message: "Server is running 🚀"
        });
    });

    test('nên trả về lỗi 404 cho các route không tồn tại', async () => {
        const response = await request(app).get('/api/not-found-route');

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: 'Route not found'
        });
    });
});