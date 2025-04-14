import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductPriceDto } from './product-price.dto';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceDto)
  @IsOptional()
  prices?: ProductPriceDto[];
}