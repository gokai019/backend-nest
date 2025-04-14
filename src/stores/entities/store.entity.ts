import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductStore } from '../../products/entities/product-store.entity';

@Entity()
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  description: string;

  @OneToMany(() => ProductStore, productStore => productStore.store)
  productPrices: ProductStore[];
}