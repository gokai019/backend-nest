import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../../src/products/products.module'; 
import { Product } from '../../src/products/entities/product.entity';
import { ProductStore } from '../../src/products/entities/product-store.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { StoresModule } from '../../src/stores/stores.module'; 

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let createdProductId: number;

 
  beforeAll(async () => {
    jest.setTimeout(30000);
  
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ProductsModule,
        StoresModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'secret',
          database: 'product_management_test',
          entities: [Product, ProductStore, Store],
          synchronize: true, 
          dropSchema: true, 
        }),
      ],
    }).compile();
  
    app = moduleFixture.createNestApplication();
    await app.init();
  
    await request(app.getHttpServer())
      .post('/stores')
      .send({ description: 'Store 1' })
      .expect(201);
    
    await request(app.getHttpServer())
      .post('/stores')
      .send({ description: 'Store 2' })
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
  
  describe('/products (POST)', () => {
    it('should create a product with prices', async () => {
      const createProductDto = {
        description: 'Test Product',
        cost: 10.5,
        prices: [
          { storeId: 1, salePrice: 15.99 },
          { storeId: 2, salePrice: 16.99 },
        ],
      };
  
      const response = await request(app.getHttpServer())
        .post('/products')
        .send(createProductDto)
        .expect(201);
  
      createdProductId = response.body.id;
      expect(response.body).toMatchObject({
        description: 'Test Product',
        prices: expect.arrayContaining([
          expect.objectContaining({ 
            store: expect.objectContaining({ id: 1 }),
            salePrice: expect.stringContaining("15.99")
          }),
          expect.objectContaining({ 
            store: expect.objectContaining({ id: 2 }),
            salePrice: expect.stringContaining("16.99")
          })
        ])
      });
    });
  
    it('should fail when creating with duplicate store prices', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          description: 'Duplicate Test',
          cost: 10.5,
          prices: [
            { storeId: 1, salePrice: 15.99 },
            { storeId: 1, salePrice: 16.99 },
          ],
        });
  
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('/products (GET)', () => {
    it('should return paginated products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should filter products by description', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ description: 'Test' })
        .expect(200);

      expect(response.body.data.some(p => p.description.includes('Test'))).toBeTruthy();
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .send({
          description: 'Test Product',
          cost: 10.5,
          prices: [{ storeId: 1, salePrice: 15.99 }]
        });
  
      const productId = createResponse.body.id;
      
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);
  
      expect(response.body.id).toEqual(productId);
    });
  });

  describe('/products/:id/prices (POST)', () => {
    it('should add a price to a product', async () => {
      const product = await request(app.getHttpServer())
        .post('/products')
        .send({
          description: 'Price Test',
          cost: 10.5
        });
  
      const response = await request(app.getHttpServer())
        .post(`/products/${product.body.id}/prices`)
        .send({ storeId: 1, salePrice: 15.99 })
        .expect(201);
  
      expect(response.body.salePrice).toEqual(15.99);
    });
  });

  afterEach(async () => {
    await request(app.getHttpServer())
      .delete(`/products/${createdProductId}`)
      .catch(() => {}); 
  });
});