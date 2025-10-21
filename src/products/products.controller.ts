import { Controller, Get, Post, Put, Delete, UseGuards, Request, Query} from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { ReviewDto } from '../auth/dto/review.dto';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateProductDto } from 'src/auth/dto/update-product.dto'; 
import { PaginationDto } from 'src/auth/dto/pagination.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Multer } from 'multer';




@ApiTags('Products')    
@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService){}

    @ApiOperation({ summary: 'create a new product' })
    @ApiBearerAuth()
    @ApiBody({ type: CreateProductDto })
    @ApiResponse({ status: 201, description: 'Product successfully created' })
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
    @ApiOperation({ summary: 'Get all products with optional filters\n if you want to view image http://localhost:3000/{paste path of image or url and hit api in new browser}' })
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
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteProduct(@Request() req, @Param('id') id: string){
        console.log("This api got hit delete a single product=================http://localhost:3000/products/:id=================");
        return this.productsService.remove(req.user.id, id);
    }

    @ApiOperation({ summary: 'Get all reviews of a product' })

    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of reviews to take' })
    @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Rating to filter by' })
    @Get(":id/reviews")
    async getAll(
      @Param('id') productId: string, 
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('rating') rating?: number
 
    ) {
      console.log("This api got hit get all=================http://localhost:3000/products=================");
      const paginationDto = new PaginationDto();
      paginationDto.page = page;
      paginationDto.limit = limit;
      paginationDto.rating = rating;
      return await this.productsService.getReviews(productId, paginationDto);
    }

    @ApiOperation({ summary: 'Create one feedback' })
    @ApiResponse({ status: 201, description: 'Feedback created successfully' })
    @ApiBody({ type: ReviewDto })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/reviews')
    async review(@Request() req, @Param('id') productId: string, @Body() reviewDto: ReviewDto) {
      console.log("This api got hit create one feedback=================http://localhost:3000/products/:id/reviews=================");
      return this.productsService.createReview(req.user.id, productId, reviewDto);
    }

    @ApiOperation({ summary: 'Delete one feedback' })
    @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/reviews/:reviewId')
    async delete(@Request() req, @Param('id') productId: string, @Param('reviewId') reviewId: string) {
      console.log("This api got hit delete feedback=================http://localhost:3000/products/:id/review/:reviewId=================");
      return this.productsService.deleteReview(req.user.id, reviewId);
    }

    @ApiOperation({ summary: 'Upload image'})
    @ApiResponse({ status: 200, description: 'Image uploaded' })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
            description: 'Image file',
          },
        },
      },
    })
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image',{
      storage: diskStorage({
        destination: (req, file, cb)=>{
          const productId = req.params.id;
          const uploadDir = `./uploads/products/${productId}`;
          const fs = require('fs');
          const {join} = require('path');
          const fullPath = join(process.cwd(), uploadDir);
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      }
    }))
    @Post(':id/images')
    async uploadImage(@Param('id') productID : string, @Request() req, @UploadedFile() file: Multer.File){
      if (!file) {
        throw new Error('File is required');
      }
      
      // Manual file size validation (5MB limit)
      if (file.size > 1024 * 1024 * 5) {
        throw new Error('File size exceeds the 5MB limit');
      }
      console.log("This api got hit upload image=================http://localhost:3000/products/:id/images=================");
      return this.productsService.uploadImage(req.user.id, productID, file);
    }




    @ApiOperation({ summary: 'Delete image' })
    @ApiResponse({ status: 200, description: 'Image deleted' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':id/images/:imageId')
    async deleteImage(@Param('id') productID : string, @Param('imageId') imageID : string, @Request() req) { 
      console.log("This api got hit delete image=================http://localhost:3000/products/:id/images/:imageId=================");
      return this.productsService.deleteImage(req.user.id, productID, imageID);
    }
}

