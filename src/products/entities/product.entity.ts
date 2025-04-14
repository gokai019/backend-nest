import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductStore } from './product-store.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60 })
  description: string;

  @Column({ type: 'decimal', precision: 13, scale: 3, nullable: true })
  cost: number;

  @OneToMany(() => ProductStore, productStore => productStore.product)
  prices: ProductStore[];
}