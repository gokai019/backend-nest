import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProductStore } from './product-store.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60 })
  description: string;

  @Column({ type: 'decimal', precision: 13, scale: 3, nullable: true })
  cost: number;

  @Column({ type: 'bytea', nullable: true }) 
  image: Buffer;

  @OneToMany(() => ProductStore, productStore => productStore.product)
  prices: ProductStore[];
}