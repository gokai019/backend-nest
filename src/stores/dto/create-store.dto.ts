import { IsString, Length } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @Length(1, 100)
  description: string;
}