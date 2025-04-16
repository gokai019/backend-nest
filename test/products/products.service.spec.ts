import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../../src/products/products.service';
import { Product } from '../../src/products/entities/product.entity';
import { ProductStore } from '../../src/products/entities/product-store.entity';
import { Store } from '../../src/stores/entities/store.entity';
import { CreateProductDto } from '../../src/products/dto/create-product.dto';
import { ProductPriceDto } from '../../src/products/dto/product-price.dto';
import { ProductFilterDto } from '../../src/products/dto/product-filter.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateProductDto } from '../../src/products/dto/update-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let productStoreRepository: Repository<ProductStore>;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockProductStoreRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductStore),
          useValue: mockProductStoreRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    productStoreRepository = module.get<Repository<ProductStore>>(
      getRepositoryToken(ProductStore),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product with prices', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        prices: [{ storeId: 1, salePrice: 15.99 }],
      };

      const savedProduct = { id: 1, description: 'Test Product' } as Product;
      const savedPrice = { id: 1, salePrice: 15.99 } as ProductStore;

      mockProductRepository.create.mockReturnValue(savedProduct);
      mockProductRepository.save.mockResolvedValue(savedProduct);
      mockProductStoreRepository.create.mockReturnValue(savedPrice);
      mockProductStoreRepository.save.mockResolvedValue(savedPrice);
      mockProductRepository.findOne.mockResolvedValue({
        ...savedProduct,
        prices: [savedPrice],
      });

      const result = await service.create(createProductDto);

      expect(result).toEqual({
        ...savedProduct,
        prices: [savedPrice],
      });
      expect(mockProductRepository.create).toHaveBeenCalledWith({
        description: 'Test Product',
      });
      expect(mockProductStoreRepository.create).toHaveBeenCalledWith({
        product: savedProduct,
        store: { id: 1 },
        salePrice: 15.99,
      });
    });

    it('should throw BadRequestException when no prices are provided', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        prices: [],
      };

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when prices already exist', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        prices: [{ storeId: 1, salePrice: 15.99 }],
      };

      mockProductStoreRepository.find.mockResolvedValue([{ store: { id: 1 } }]);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products with filters', async () => {
      const filterDto: ProductFilterDto = {
        page: 1,
        limit: 10,
        description: 'Test',
      };

      const mockProducts = [{ id: 1, description: 'Test Product' }];
      const mockCount = 1;

      mockProductRepository
        .createQueryBuilder()
        .getManyAndCount.mockResolvedValue([mockProducts, mockCount]);

      const result = await service.findAll(filterDto);

      expect(result).toEqual({
        data: mockProducts,
        count: mockCount,
      });
      expect(
        mockProductRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('product.description ILIKE :description', {
        description: '%Test%',
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 1;
      const mockProduct = { id: productId, description: 'Test Product' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['prices', 'prices.store'],
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      const productId = 999;

      mockProductRepository.findOne.mockResolvedValue(undefined);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product and its prices', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        description: 'Updated Product',
        prices: [{ storeId: 1, salePrice: 19.99 }],
      };

      const existingProduct = {
        id: productId,
        description: 'Test Product',
        prices: [{ id: 1, store: { id: 1 }, salePrice: 15.99 }],
      } as Product;

      const updatedProduct = { ...existingProduct, description: 'Updated Product' };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockResolvedValue(undefined);
      mockProductStoreRepository.remove.mockResolvedValue(undefined);
      mockProductStoreRepository.save.mockResolvedValue(undefined);
      mockProductRepository.findOne.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith(productId, {
        description: 'Updated Product',
      });
    });

    it('should throw BadRequestException when no prices are provided in update', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        description: 'Updated Product',
        prices: [],
      };

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = 1;
      const mockProduct = { id: productId, description: 'Test Product' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.remove.mockResolvedValue(mockProduct);

      await service.remove(productId);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
        relations: ['prices', 'prices.store'],
      });
      expect(mockProductRepository.remove).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('addPrice', () => {
    it('should add a price to a product', async () => {
      const productId = 1;
      const priceDto: ProductPriceDto = { storeId: 2, salePrice: 17.99 };

      const mockProduct = { id: productId, description: 'Test Product' };
      const mockPrice = { id: 2, salePrice: 17.99 } as ProductStore;

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductStoreRepository.findOne.mockResolvedValue(undefined);
      mockProductStoreRepository.create.mockReturnValue(mockPrice);
      mockProductStoreRepository.save.mockResolvedValue(mockPrice);

      const result = await service.addPrice(productId, priceDto);

      expect(result).toEqual(mockPrice);
      expect(mockProductStoreRepository.create).toHaveBeenCalledWith({
        product: mockProduct,
        store: { id: 2 },
        salePrice: 17.99,
      });
    });

    it('should throw ConflictException when price for store already exists', async () => {
      const productId = 1;
      const priceDto: ProductPriceDto = { storeId: 1, salePrice: 17.99 };

      const mockProduct = { id: productId, description: 'Test Product' };
      const existingPrice = { id: 1, salePrice: 15.99 } as ProductStore;

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductStoreRepository.findOne.mockResolvedValue(existingPrice);

      await expect(service.addPrice(productId, priceDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removePrice', () => {
    it('should remove a price from a product', async () => {
      const productId = 1;
      const storeId = 1;
      const mockPrice = { id: 1, salePrice: 15.99 } as ProductStore;

      mockProductStoreRepository.findOne.mockResolvedValue(mockPrice);
      mockProductStoreRepository.remove.mockResolvedValue(mockPrice);

      await service.removePrice(productId, storeId);

      expect(mockProductStoreRepository.findOne).toHaveBeenCalledWith({
        where: {
          product: { id: productId },
          store: { id: storeId },
        },
      });
      expect(mockProductStoreRepository.remove).toHaveBeenCalledWith(mockPrice);
    });

    it('should throw NotFoundException when price not found', async () => {
      const productId = 1;
      const storeId = 999;

      mockProductStoreRepository.findOne.mockResolvedValue(undefined);

      await expect(service.removePrice(productId, storeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});