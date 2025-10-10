import { Controller, Get, Post, Put, Delete, UseGuards, Request, Query, Search } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationDto } from 'src/auth/dto/pagination.dto';
import { UpdateProductDto } from 'src/auth/dto/update-product.dto';
import { min } from 'class-validator';



@ApiTags('Products')    
@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService){}

    @ApiOperation({ summary: 'create a new product' })
    @ApiBearerAuth()
    @ApiBody({ type: CreateProductDto })
    @ApiResponse({ status: 201, description: 'Product successfully created' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
    @UseGuards(JwtAuthGuard)
    @Post()
    async addProduct(@Request() req, @Body() createProductDto: CreateProductDto){
        console.log("This api got hit add a single product =================http://localhost:3000/products/=================");
        return this.productsService.create(req.user.id, createProductDto);
    }

    @Get()
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor for pagination' })
    @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of products to take' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search query' })
    @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Category to filter by' })
    @ApiQuery({ name: 'min', required: false, type: Number, description: 'Minimum price' })
    @ApiQuery({ name: 'max', required: false, type: Number, description: 'Maximum price' })
    @ApiQuery({ name: 'instock', required: false, type: Boolean, description: 'Filter by stock' })
    @ApiOperation({ summary: 'Get all products with optional filters' })
    @ApiResponse({ status: 200, description: 'All products returned based on filters' })
    async getProducts(
      @Query('cursor') cursor?: string,
      @Query('take') take: number=10,
      @Query('search') search?: string,
      @Query('categoryId') categoryId?: string,
      @Query('min') min?: number,
      @Query('max') max?: number,
      @Query('instock') instock?: number,
    ){
      const filters = 
      { 
        search, categoryId, 
        min: min !== undefined ? Number(min) : undefined, 
        max: max !== undefined ? Number(max) : undefined, 
        instock: instock !== undefined ? Boolean(instock) : undefined
      };
      const page = { cursor, take:Number(take)};

      console.log("This api got hit get all products=================http://localhost:3000/products=================")
      return this.productsService.findAll(page, filters);
    }


    @ApiOperation({ summary: 'Get a single product' })
    @ApiResponse({ status: 200, description: 'Single product returned' })
    @Get(':id')
    async getSingleProduct(@Param('id') id: string){
        console.log("This api got hit get a single product=================http://localhost:3000/products/:id=================");
        return this.productsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a product by ID' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiBody({ type: UpdateProductDto })
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto){
        console.log("This api got hit update a single product=================http://localhost:3000/products/:id=================");
        return this.productsService.update(id, updateProductDto);
    }

    @ApiOperation({ summary: 'Delete a product by ID' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: String, description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteProduct(@Param('id') id: string){
        console.log("This api got hit delete a single product=================http://localhost:3000/products/:id=================");
        return this.productsService.remove(id);
    }

    @ApiOperation({ summary: 'Upload image' })
    @ApiResponse({ status: 200, description: 'Image uploaded' })
    @Post(':id/images')
    async uploadImage() {
        console.log("This api got hit upload image=================http://localhost:3000/products/:id/images=================");
        return 'uploadImage';
    }

    @ApiOperation({ summary: 'Delete image' })
    @ApiResponse({ status: 200, description: 'Image deleted' })
    @Delete(':id/images/:imageId')
    async deleteImage() {
        console.log("This api got hit delete image=================http://localhost:3000/products/:id/images/:imageId=================");
        return 'This action deletes a #id image';
    }

    @ApiOperation({ summary: 'Get all feedback' })
    @ApiResponse({ status: 200, description: 'All feedback returned' })
    @Get(":id/review")
    async getAll() {
      console.log("This api got hit get all=================http://localhost:3000/products=================");
      return 'getAll Feedback';
    }

    @ApiOperation({ summary: 'Create one feedback' })
    @ApiResponse({ status: 201, description: 'Feedback created successfully' })
    @Post(':id/review')
    async review(@Param('id') id: string, @Body() feedbackData: any) {
      console.log("This api got hit create one feedback=================http://localhost:3000/products/:id/review=================");
      return `Created feedback for product ${id}`;
    }

    @ApiOperation({ summary: 'Delete one feedback' })
    @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
    @Delete(':id/review/:reviewId')
    async delete(@Param('id') id: string, @Param('reviewId') reviewId: string) {
      console.log("This api got hit delete feedback=================http://localhost:3000/products/:id/review/:reviewId=================");
      return `Deleted feedback ${reviewId} for product ${id}`;
    }


  


}
