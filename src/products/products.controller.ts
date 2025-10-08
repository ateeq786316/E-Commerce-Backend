import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Products')    
@Controller('products')
export class ProductsController {
    constructor(){}

    @ApiOperation({ summary: 'Add a product' })
    @ApiResponse({ status: 200, description: 'Product added' })
    @Post()
    async addProduct(){
        return 'Product added';
    }

    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({ status: 200, description: 'All products returned' })
    @Get()
    async getProducts(){
        return 'Returning all Products';
    }

    @ApiOperation({ summary: 'Get a single product' })
    @ApiResponse({ status: 200, description: 'Single product returned' })
    @Get(':id')
    async getSingleProduct(){
        return 'Returning single Product';
    }

    @ApiOperation({ summary: 'Update a product' })
    @ApiResponse({ status: 200, description: 'Product updated' })
    @Put(':id')
    async updateProduct(){
        return 'Updating Product';
    }

    @ApiOperation({ summary: 'Delete a product' })
    @ApiResponse({ status: 200, description: 'Product deleted' })
    @Delete(':id')
    async deleteProduct(){
        return 'Deleting Product';
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
