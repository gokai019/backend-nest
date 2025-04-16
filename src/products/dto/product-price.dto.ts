import { IsNumber, IsPositive, IsInt } from 'class-validator';
import { Type,Transform  } from 'class-transformer';
import { Column } from 'typeorm';

export class ProductPriceDto {
  @IsInt()
  @IsPositive()
  storeId: number;

  @IsNumber()
  @IsPositive()
  @Column({ type: 'decimal', precision: 10, scale: 2 })

  salePrice: number;
}