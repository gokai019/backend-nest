import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductPriceDto } from './product-price.dto';

export class CreateProductDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceDto)
  prices: ProductPriceDto[];
}