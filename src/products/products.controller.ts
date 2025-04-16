import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductPriceDto } from './dto/product-price.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file) {
      createProductDto.image = file.buffer;
    }
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() filterDto: ProductFilterDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      let updateData: any = {};
      
      if (body.data) {
        updateData = JSON.parse(body.data);
      } else {
        updateData = body;
      }
  
      if (file) {
        updateData.image = file.buffer;
      }
  
      return this.productsService.update(+id, updateData);
    } catch (error) {
      throw new BadRequestException('Erro ao processar dados do produto');
    }
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post(':id/prices')
  addPrice(@Param('id') id: string, @Body() productPriceDto: ProductPriceDto) {
    return this.productsService.addPrice(+id, productPriceDto);
  }

  @Delete(':productId/prices/:storeId')
  removePrice(
    @Param('productId') productId: string,
    @Param('storeId') storeId: string,
  ) {
    return this.productsService.removePrice(+productId, +storeId);
  }
}