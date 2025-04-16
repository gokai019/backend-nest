import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type,Transform  } from 'class-transformer';
import { ProductPriceDto } from './product-price.dto';
import { Column } from 'typeorm';

export class CreateProductDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost?: number;

  @IsOptional()
  image?: Buffer; 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceDto)
  prices: ProductPriceDto[];
}