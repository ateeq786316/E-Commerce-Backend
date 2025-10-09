import { Controller, Get, Post, Put, Delete, UseGuards, Request, Query, Search } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationDto } from 'src/auth/dto/pagination.dto';
import { UpdateCategoryDto } from 'src/auth/dto/update-category.dto';
import { UpdateProductDto } from 'src/auth/dto/update-product.dto';


@ApiTags('Products')    
@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService){}

    @ApiOperation({ summary: 'Add a product' })
    @ApiResponse({ status: 200, description: 'Product added' })
    @UseGuards(JwtAuthGuard)
    @Post()
    async addProduct(@Request() req, @Body() createProductDto: CreateProductDto){
        return this.productsService.create(req.user.id, createProductDto);
    }

    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({ status: 200, description: 'All products returned' })
    @Get()
    async getProducts(
      @Query() paginationDto: PaginationDto,
      @Query('search') search?: string,
      @Query('categoryId') categoryId?: string,
      @Query('minPrice') minPrice?: number,
      @Query('maxPrice') maxPrice?: number,
      @Query('inStock') inStock?: boolean,
    ){
      const filters={
        search,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
      };
        return this.productsService.findAll(paginationDto, filters);
    }

    @ApiOperation({ summary: 'Get a single product' })
    @ApiResponse({ status: 200, description: 'Single product returned' })
    @Get(':id')
    async getSingleProduct(@Param('id') id: string){
        return this.productsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a product' })
    @ApiResponse({ status: 200, description: 'Product updated' })
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto){
        return this.productsService.update(id, updateProductDto);
    }

    @ApiOperation({ summary: 'Delete a product' })
    @ApiResponse({ status: 200, description: 'Product deleted' })
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteProduct(@Param('id') id: string){
        return this.productsService.remove(id);
    }

    @ApiOperation({ summary: 'Upload image' })
    @ApiResponse({ status: 200, description: 'Image uploaded' })
    @Post(':id/images')
    async uploadImage() {
        return 'uploadImage';
    }

    @ApiOperation({ summary: 'Delete image' })
    @ApiResponse({ status: 200, description: 'Image deleted' })
    @Delete(':id/images/:imageId')
    async deleteImage() {
        return 'This action deletes a #id image';
    }

    @ApiOperation({ summary: 'Get all feedback' })
  @ApiResponse({ status: 200, description: 'All feedback returned' })
  @Get()
  async getAll() {
    return 'getAll Feedback';
  }

  @ApiOperation({ summary: 'Create one feedback' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @Post(':id/review')
  async review(@Param('id') id: string, @Body() feedbackData: any) {
    return `Created feedback for product ${id}`;
  }

  @ApiOperation({ summary: 'Delete one feedback' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @Delete(':id/review/:reviewId')
  async delete(@Param('id') id: string, @Param('reviewId') reviewId: string) {
    return `Deleted feedback ${reviewId} for product ${id}`;
  }
}
