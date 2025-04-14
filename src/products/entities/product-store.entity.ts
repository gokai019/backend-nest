import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity()
export class ProductStore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, product => product.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ type: 'decimal', precision: 13, scale: 3 })
  salePrice: number;
}