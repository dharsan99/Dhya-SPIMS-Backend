const request = require('supertest');
const http = require('http');
const app = require('../index');

const TEST_TOKEN = 'Bearer YOUR_VALID_JWT_TOKEN_HERE';
const VALID_EMPLOYEE_ID = 'REPLACE_WITH_VALID_EMPLOYEE_ID';

let server;

beforeAll((done) => {
  server = http.createServer(app);
  server.listen(done);
});

afterAll((done) => {
  server.close(done);
});

describe('Attendance Routes', () => {
  it('should return all attendance records (GET /attendance)', async () => {
    const res = await request(server)
      .get('/attendance')
      .set('Authorization', TEST_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new attendance record (POST /attendance)', async () => {
    const res = await request(server)
      .post('/attendance')
      .set('Authorization', TEST_TOKEN)
      .send({
        date: '2025-06-09',
        shift: 'Morning',
        in_time: '2025-06-09T08:00:00.000Z',
        out_time: '2025-06-09T17:00:00.000Z',
        overtime_hours: 1.5,
        total_hours: 9.5,
        status: 'PRESENT',
        employee_id: VALID_EMPLOYEE_ID,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should return 401 if no token is provided (GET /attendance)', async () => {
    const res = await request(server).get('/attendance');
    expect(res.statusCode).toBe(401);
  });
});
