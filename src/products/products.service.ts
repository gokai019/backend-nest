import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { ProductStoreRepository } from './repositories/product-store.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductPriceDto } from './dto/product-price.dto';
import { Product } from './entities/product.entity';
import { ProductStore } from './entities/product-store.entity';
import { Store } from '../stores/entities/store.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductStore)
    private readonly productStoreRepository: Repository<ProductStore>,
    
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { prices, ...productData } = createProductDto;
    
    if (prices && prices.length === 0) {
      throw new BadRequestException('At least one price must be provided');
    }

    const product = this.productRepository.create(productData);
    await this.productRepository.save(product);

    if (prices && prices.length > 0) {
      await this.addPricesToProduct(product.id, prices);
    }

    return this.findOne(product.id);
  }

  async findAll(filterDto: ProductFilterDto): Promise<{ data: Product[]; count: number }> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC', ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.prices', 'productStore')
      .leftJoinAndSelect('productStore.store', 'store')
      .take(limit)
      .skip(skip)
      .orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    if (filters.id) {
      query.andWhere('product.id = :id', { id: filters.id });
    }

    if (filters.description) {
      query.andWhere('product.description ILIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    if (filters.cost) {
      query.andWhere('product.cost = :cost', { cost: filters.cost });
    }

    if (filters.salePrice) {
      query.andWhere('productStore.salePrice = :salePrice', {
        salePrice: filters.salePrice,
      });
    }

    const [data, count] = await query.getManyAndCount();

    return { data, count };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['prices', 'prices.store'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { prices, ...productData } = updateProductDto;

    await this.productRepository.update(id, productData);

    if (prices) {
      await this.syncProductPrices(id, prices);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async addPrice(id: number, productPriceDto: ProductPriceDto): Promise<ProductStore> {
    const product = await this.findOne(id);
    const existingPrice = await this.productStoreRepository.findOne({
      where: {
        product: { id },
        store: { id: productPriceDto.storeId },
      },
    });

    if (existingPrice) {
      throw new ConflictException('A price for this store already exists');
    }

    const price = this.productStoreRepository.create({
      product,
      store: { id: productPriceDto.storeId },
      salePrice: productPriceDto.salePrice,
    });

    return this.productStoreRepository.save(price);
  }

  async removePrice(productId: number, storeId: number): Promise<void> {
    const price = await this.productStoreRepository.findOne({
      where: {
        product: { id: productId },
        store: { id: storeId },
      },
    });

    if (!price) {
      throw new NotFoundException(
        `Price for product ID ${productId} and store ID ${storeId} not found`,
      );
    }

    await this.productStoreRepository.remove(price);
  }

  private async addPricesToProduct(productId: number, prices: ProductPriceDto[]): Promise<void> {
    const product = await this.findOne(productId);
    const storeIds = prices.map(price => price.storeId);

    const existingPrices = await this.productStoreRepository.find({
      where: {
        product: { id: productId },
        store: { id: In(storeIds) },
      },
    });

    if (existingPrices.length > 0) {
      const existingStoreIds = existingPrices.map(price => price.store.id);
      throw new ConflictException(
        `Prices already exist for stores: ${existingStoreIds.join(', ')}`,
      );
    }

    const productPrices = prices.map(price =>
      this.productStoreRepository.create({
        product,
        store: { id: price.storeId },
        salePrice: price.salePrice,
      }),
    );

    await this.productStoreRepository.save(productPrices);
  }

  private async syncProductPrices(id: number, prices: ProductPriceDto[]): Promise<void> {
    if (prices.length === 0) {
      throw new BadRequestException('At least one price must be provided');
    }

    const existingPrices = await this.productStoreRepository.find({
      where: { product: { id } },
    });

    const pricesToRemove = existingPrices.filter(
      ep => !prices.some(p => p.storeId === ep.store.id),
    );
    await this.productStoreRepository.remove(pricesToRemove);

    for (const price of prices) {
      const existingPrice = existingPrices.find(ep => ep.store.id === price.storeId);
      if (existingPrice) {
        existingPrice.salePrice = price.salePrice;
        await this.productStoreRepository.save(existingPrice);
      } else {
        await this.addPrice(id, price);
      }
    }
  }
}