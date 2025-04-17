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
  let storeRepository: Repository<Store>;

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
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockProductStoreRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
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
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    productStoreRepository = module.get<Repository<ProductStore>>(
      getRepositoryToken(ProductStore),
    );
    storeRepository = module.get<Repository<Store>>(getRepositoryToken(Store));

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product with prices', async () => {
      // Setup mocks properly for the entire flow
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        cost: 10.99,
        prices: [{ storeId: 1, salePrice: 15.99 }],
      };

      const savedProduct = { id: 1, description: 'Test Product', cost: 10.99 } as Product;
      const savedPrice = { id: 1, salePrice: 15.99, store: { id: 1 } } as ProductStore;
      const productWithPrices = { 
        ...savedProduct, 
        prices: [savedPrice] 
      };

      // Mock for service.create -> findOne first return (no existing product first)
      mockProductRepository.create.mockReturnValue(savedProduct);
      mockProductRepository.save.mockResolvedValue(savedProduct);
      
      // Important: Set up a proper sequence of mock returns for findOne
      // For the internal findOne calls in create method and addPricesToProduct method
      mockProductRepository.findOne
        .mockResolvedValueOnce(savedProduct)  // Initial product lookup
        .mockResolvedValueOnce(productWithPrices);  // Final product lookup with prices
      
      // For price lookup to check if exists
      mockProductStoreRepository.find.mockResolvedValue([]);
      mockProductStoreRepository.create.mockReturnValue(savedPrice);
      mockProductStoreRepository.save.mockResolvedValue(savedPrice);

      const result = await service.create(createProductDto);

      expect(result).toEqual(productWithPrices);
      expect(mockProductRepository.create).toHaveBeenCalledWith({
        description: 'Test Product',
        cost: 10.99,
      });
    });

    it('should throw BadRequestException when no prices are provided', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        cost: 10.99,
        prices: [], // Empty array to trigger BadRequestException
      };
    
      // No need to mock the service.create method anymore
      // Just let the actual implementation handle it
      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when prices already exist', async () => {
      const createProductDto: CreateProductDto = {
        description: 'Test Product',
        cost: 10.99,
        prices: [{ storeId: 1, salePrice: 15.99 }],
      };

      const savedProduct = { id: 1, description: 'Test Product', cost: 10.99 } as Product;
      mockProductRepository.create.mockReturnValue(savedProduct);
      mockProductRepository.save.mockResolvedValue(savedProduct);
      
      // Mock findOne for the initial product creation
      mockProductRepository.findOne.mockResolvedValueOnce(savedProduct);
      
      // Return existing prices that match the ones in the DTO
      mockProductStoreRepository.find.mockResolvedValueOnce([{ 
        store: { id: 1 } 
      }]);

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

    const queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockProducts, mockCount]),
    };
    
    mockProductRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const result = await service.findAll(filterDto);

    expect(result).toEqual({
      data: mockProducts,
      count: mockCount,
    });
    
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'product.description ILIKE :description', 
      { description: '%Test%' }
    );
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
        cost: 12.99,
        prices: [{ storeId: 1, salePrice: 19.99 }],
      };

      const existingProduct = {
        id: productId,
        description: 'Test Product',
        cost: 10.99,
        prices: [{ id: 1, store: { id: 1 }, salePrice: 15.99 }],
      } as Product;

      const updatedProduct = { 
        ...existingProduct, 
        description: 'Updated Product', 
        cost: 12.99,
        prices: [{ id: 1, store: { id: 1 }, salePrice: 19.99 }]
      };

      // Mock the initial findOne call
      mockProductRepository.findOne.mockResolvedValueOnce(existingProduct);
      
      // Mock update product
      mockProductRepository.update.mockResolvedValue({ affected: 1 });
      
      // Mock finding product store entries for sync
      mockProductStoreRepository.find.mockResolvedValueOnce([
        { id: 1, store: { id: 1 }, salePrice: 15.99 }
      ]);
      
      // Mock save for updating the price
      mockProductStoreRepository.save.mockResolvedValue({ id: 1, store: { id: 1 }, salePrice: 19.99 });
      
      // Mock final findOne to return updated product
      mockProductRepository.findOne.mockResolvedValueOnce(updatedProduct);

      const result = await service.update(productId, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith(productId, {
        description: 'Updated Product',
        cost: 12.99,
      });
    });

    it('should throw BadRequestException when no prices are provided in update', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        description: 'Updated Product',
        cost: 12.99,
        prices: [],
      };

      // Setup the mocks for the initial findOne (needed before it can throw BadRequestException)
      const existingProduct = {
        id: productId,
        description: 'Test Product',
        cost: 10.99,
        prices: [{ id: 1, store: { id: 1 }, salePrice: 15.99 }],
      } as Product;
      
      mockProductRepository.findOne.mockResolvedValueOnce(existingProduct);

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