import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CreateProductDto } from '../../src/products/dto/create-product.dto';
import { ProductPriceDto } from '../../src/products/dto/product-price.dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../src/products/entities/product.entity';
import { ProductStore } from '../../src/products/entities/product-store.entity';
import { Store } from '../../src/stores/entities/store.entity';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forFeature([Product, ProductStore, Store]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a product with prices', async () => {
      const createProductDto: CreateProductDto = {
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

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.description).toEqual(createProductDto.description);
      expect(response.body.data.prices).toHaveLength(2);
    });

    it('should fail when creating a product with duplicate store prices', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product Duplicate',
        prices: [
          { storeId: 1, salePrice: 15.99 },
          { storeId: 1, salePrice: 16.99 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .send(createProductDto)
        .expect(409);

      expect(response.body.message).toContain('Prices already exist for stores');
    });
  });

  describe('/products (GET)', () => {
    it('should return paginated products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeDefined();
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
      const product = await createTestProduct(app);

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body.data.id).toEqual(product.id);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/999999')
        .expect(404);
    });
  });

  describe('/products/:id/prices (POST)', () => {
    it('should add a price to a product', async () => {
      const product = await createTestProduct(app);
      const priceDto: ProductPriceDto = { storeId: 3, salePrice: 17.99 };

      const response = await request(app.getHttpServer())
        .post(`/products/${product.id}/prices`)
        .send(priceDto)
        .expect(201);

      expect(response.body.data.salePrice).toEqual(priceDto.salePrice);
    });

    it('should fail when adding duplicate store price', async () => {
      const product = await createTestProduct(app);
      const priceDto: ProductPriceDto = { storeId: 1, salePrice: 18.99 };

      const response = await request(app.getHttpServer())
        .post(`/products/${product.id}/prices`)
        .send(priceDto)
        .expect(409);

      expect(response.body.message).toContain('A price for this store already exists');
    });
  });

  async function createTestProduct(app: INestApplication): Promise<Product> {
    const createProductDto: CreateProductDto = {
      description: 'Test Product for GET',
      prices: [{ storeId: 1, salePrice: 19.99 }],
    };

    const response = await request(app.getHttpServer())
      .post('/products')
      .send(createProductDto);

    return response.body.data;
  }
});