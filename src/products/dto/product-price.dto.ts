import { IsNumber, IsPositive, IsInt } from 'class-validator';

export class ProductPriceDto {
  @IsInt()
  @IsPositive()
  storeId: number;

  @IsNumber()
  @IsPositive()
  salePrice: number;
}