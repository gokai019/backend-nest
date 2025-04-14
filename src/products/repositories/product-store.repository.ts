import { EntityRepository, Repository } from 'typeorm';
import { ProductStore } from '../entities/product-store.entity';

@EntityRepository(ProductStore)
export class ProductStoreRepository extends Repository<ProductStore> {}