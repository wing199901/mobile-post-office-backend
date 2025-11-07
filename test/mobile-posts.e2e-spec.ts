import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ApiExceptionFilter } from './../src/common/filters/api-exception.filter';

describe('Mobile Posts API (e2e)', () => {
  let app: INestApplication<App>;
  let createdRecordId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configurations as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (createdRecordId) {
      await request(app.getHttpServer()).delete(
        `/api/mobileposts/${createdRecordId}`,
      );
    }

    // Close the application and database connections
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/mobileposts - List & Filter', () => {
    it('should return paginated list of mobile posts (English)', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?lang=en&page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('header');
          expect(res.body.header.success).toBe(true);
          expect(res.body.header).toHaveProperty('message');
          expect(res.body.header).not.toHaveProperty('err_code');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
          expect(res.body).toHaveProperty('result');
          expect(Array.isArray(res.body.result)).toBe(true);
        });
    });

    it('should return list in Traditional Chinese', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?lang=tc&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 0) {
            expect(res.body.result[0]).toHaveProperty('name');
            expect(res.body.result[0]).toHaveProperty('district');
          }
        });
    });

    it('should return all language fields when lang=all', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?lang=all&limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 0) {
            const record = res.body.result[0];
            expect(record).toHaveProperty('nameEN');
            expect(record).toHaveProperty('nameTC');
            expect(record).toHaveProperty('nameSC');
            expect(record).toHaveProperty('districtEN');
            expect(record).toHaveProperty('districtTC');
            expect(record).toHaveProperty('districtSC');
          }
        });
    });

    it('should filter by district (English)', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?district=Yuen%20Long&lang=en')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 0) {
            expect(res.body.result[0].district).toContain('Yuen Long');
          }
        });
    });

    it('should filter by day of week', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?dayOfWeek=1&lang=en')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 0) {
            expect(res.body.result[0].dayOfWeekCode).toBe(1);
          }
        });
    });

    it('should search across all languages', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?search=Mobile&lang=en')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(Array.isArray(res.body.result)).toBe(true);
        });
    });

    it('should sort by opening hour ascending', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?sortBy=openHour&sortDir=asc&lang=en&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 1) {
            const first = res.body.result[0].openHour;
            const second = res.body.result[1].openHour;
            expect(first <= second).toBe(true);
          }
        });
    });

    it('should return error for invalid lang parameter', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?lang=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header).toHaveProperty('err_code');
          expect(res.body.header).toHaveProperty('err_msg');
          expect(res.body.header).not.toHaveProperty('message');
        });
    });

    it('should return error for invalid page parameter', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?page=0')
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
        });
    });

    it('should return error for limit exceeded', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?limit=999')
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
        });
    });

    it('should return error for invalid time format in openAt filter', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?openAt=25:00')
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0104');
          expect(res.body.header.err_msg).toContain('valid time');
        });
    });
  });

  describe('POST /api/mobileposts - Create', () => {
    it('should create a new mobile post record', () => {
      const newRecord = {
        mobileCode: 'TEST',
        seq: 999,
        nameEN: 'Test Mobile Post Office',
        nameTC: '測試流動郵局',
        nameSC: '测试流动邮局',
        districtEN: 'Test District',
        districtTC: '測試區',
        districtSC: '测试区',
        locationEN: 'Test Location',
        locationTC: '測試地點',
        locationSC: '测试地点',
        addressEN: '123 Test Street',
        addressTC: '測試街123號',
        addressSC: '测试街123号',
        openHour: '10:00',
        closeHour: '11:00',
        dayOfWeekCode: 1,
        latitude: 22.28,
        longitude: 114.17,
      };

      return request(app.getHttpServer())
        .post('/api/mobileposts')
        .send(newRecord)
        .expect(201)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(res.body.header).toHaveProperty('message');
          expect(res.body.result).toHaveProperty('id');
          expect(typeof res.body.result.id).toBe('number');
          createdRecordId = res.body.result.id;
        });
    });

    it('should return error for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/mobileposts')
        .send({
          mobileCode: 'TEST2',
          seq: 100,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0101');
        });
    });

    it('should return error for invalid time format', () => {
      return request(app.getHttpServer())
        .post('/api/mobileposts')
        .send({
          nameEN: 'Test',
          districtEN: 'Test',
          openHour: '25:00',
          closeHour: '10:00',
          dayOfWeekCode: 1,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
          expect(res.body.header.err_msg).toContain('valid time');
        });
    });

    it('should return error for invalid coordinates', () => {
      return request(app.getHttpServer())
        .post('/api/mobileposts')
        .send({
          nameEN: 'Test',
          districtEN: 'Test',
          latitude: 999,
          longitude: 999,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
        });
    });

    it('should return error for invalid dayOfWeekCode', () => {
      return request(app.getHttpServer())
        .post('/api/mobileposts')
        .send({
          nameEN: 'Test',
          districtEN: 'Test',
          dayOfWeekCode: 8,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
        });
    });
  });

  describe('GET /api/mobileposts/:id - Get Single', () => {
    it('should return a single record by ID', async () => {
      // First get a list to find an existing ID
      const listRes = await request(app.getHttpServer())
        .get('/api/mobileposts?limit=1')
        .expect(200);

      if (listRes.body.result.length > 0) {
        const id = listRes.body.result[0].id;

        return request(app.getHttpServer())
          .get(`/api/mobileposts/${id}?lang=en`)
          .expect(200)
          .expect((res) => {
            expect(res.body.header.success).toBe(true);
            expect(res.body.result).toHaveProperty('id');
            expect(res.body.result.id).toBe(id);
          });
      }
    });

    it('should return error for non-existent ID', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts/999999?lang=en')
        .expect(404)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0201');
        });
    });

    it('should return all languages when lang=all', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/mobileposts?limit=1')
        .expect(200);

      if (listRes.body.result.length > 0) {
        const id = listRes.body.result[0].id;

        return request(app.getHttpServer())
          .get(`/api/mobileposts/${id}?lang=all`)
          .expect(200)
          .expect((res) => {
            expect(res.body.header.success).toBe(true);
            expect(res.body.result).toHaveProperty('nameEN');
            expect(res.body.result).toHaveProperty('nameTC');
            expect(res.body.result).toHaveProperty('nameSC');
          });
      }
    });
  });

  describe('PUT /api/mobileposts/:id - Update', () => {
    it('should update partial fields of a record', async () => {
      if (!createdRecordId) {
        // Create a record first
        const createRes = await request(app.getHttpServer())
          .post('/api/mobileposts')
          .send({
            nameEN: 'Update Test',
            districtEN: 'Test District',
            openHour: '09:00',
            closeHour: '10:00',
            dayOfWeekCode: 2,
          });
        createdRecordId = createRes.body.result.id;
      }

      return request(app.getHttpServer())
        .put(`/api/mobileposts/${createdRecordId}`)
        .send({
          openHour: '08:30',
          closeHour: '09:30',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(res.body.result).toHaveProperty('id');
          expect(res.body.result.id).toBe(createdRecordId);
        });
    });

    it('should return error for empty update body', async () => {
      if (!createdRecordId) return;

      return request(app.getHttpServer())
        .put(`/api/mobileposts/${createdRecordId}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0102');
        });
    });

    it('should return error for non-existent ID', () => {
      return request(app.getHttpServer())
        .put('/api/mobileposts/999999')
        .send({
          openHour: '10:00',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0201');
        });
    });

    it('should return error for invalid time format in update', async () => {
      if (!createdRecordId) return;

      return request(app.getHttpServer())
        .put(`/api/mobileposts/${createdRecordId}`)
        .send({
          openHour: '25:00',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0103');
        });
    });
  });

  describe('DELETE /api/mobileposts/:id - Delete', () => {
    it('should delete an existing record', async () => {
      // Create a record to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/mobileposts')
        .send({
          nameEN: 'Delete Test',
          districtEN: 'Test District',
          dayOfWeekCode: 3,
        });

      const deleteId = createRes.body.result.id;

      return request(app.getHttpServer())
        .delete(`/api/mobileposts/${deleteId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(res.body.header.message).toContain('deleted');
        });
    });

    it('should return error for non-existent ID', () => {
      return request(app.getHttpServer())
        .delete('/api/mobileposts/999999')
        .expect(404)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header.err_code).toBe('0201');
        });
    });
  });

  describe('Response Format Validation', () => {
    it('success response should only have message, not err_code/err_msg', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(res.body.header).toHaveProperty('message');
          expect(res.body.header).not.toHaveProperty('err_code');
          expect(res.body.header).not.toHaveProperty('err_msg');
        });
    });

    it('error response should only have err_code/err_msg, not message', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts/999999')
        .expect(404)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          expect(res.body.header).not.toHaveProperty('message');
          expect(res.body.header).toHaveProperty('err_code');
          expect(res.body.header).toHaveProperty('err_msg');
        });
    });

    it('error response should NOT include result field', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts/999999')
        .expect(404)
        .expect((res) => {
          expect(res.body.header.success).toBe(false);
          // Error responses should NOT have result field
          expect(res.body).not.toHaveProperty('result');
          // Should have error fields
          expect(res.body.header).toHaveProperty('err_code');
          expect(res.body.header).toHaveProperty('err_msg');
        });
    });

    it('success response should include result field', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?limit=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          // Success responses MUST have result field
          expect(res.body).toHaveProperty('result');
          expect(res.body.header).toHaveProperty('message');
        });
    });
  });

  describe('Multiple Filters Combined', () => {
    it('should handle multiple filters: district + dayOfWeek', () => {
      return request(app.getHttpServer())
        .get('/api/mobileposts?district=Yuen%20Long&dayOfWeek=1&lang=en')
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          if (res.body.result.length > 0) {
            expect(res.body.result[0].dayOfWeekCode).toBe(1);
          }
        });
    });

    it('should handle search with pagination and sorting', () => {
      return request(app.getHttpServer())
        .get(
          '/api/mobileposts?search=Mobile&page=1&limit=5&sortBy=seq&sortDir=asc&lang=en',
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.header.success).toBe(true);
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });
});
