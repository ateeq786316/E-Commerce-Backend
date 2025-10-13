import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';     
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { UpdateProductDto } from '../auth/dto/update-product.dto';
import { PaginationDto } from 'src/auth/dto/pagination.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService){}

    async create(userId: string, createProductDto: CreateProductDto) {
        const created =   await this.prisma.product.create({
            data:{
                ...createProductDto,
                userId,
            },
        });
        if(created)
            return "Product added successfully";
    }

    async findAll(page: { cursor?: string, take?: number }, filters: any) {
        const { search, categoryId, min, max, instock } = filters;

        const products = await this.prisma.product.findMany({
            take: page.take,
            skip: page.cursor ? 1 : 0,
            cursor: page.cursor ? { id: page.cursor } : undefined,
            where:{
                ...(search && {name: { startsWith: search, mode: 'insensitive'}}),
                ...(categoryId && {categoryId: categoryId}),
                ...(min !== undefined && {price: {gte: min}}),
                ...(max !== undefined && {price: {lte: max}}),
                ...(instock !== undefined && {instock: instock}),
            },
            include: {category: true},
            orderBy: {id: 'asc'},
        });
        const newCursor = products.length > 0 ? products[products.length-1].id : null;
        return{
            newCursor,
            data: products, 
            nextPage: (products.length === page.take)
        };
      }

    async findOne(id: string) {
        const product = await this.prisma.product.findUnique({
            where:{id},
            include:{
                category:true,
                images:true,
                reviews:true,
            },
        });

        if(!product){
            throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
        }

        let averageRating = 0;
        if(product.reviews.length > 0){
            const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0); 
            averageRating = totalRating / product.reviews.length;
        }
        
        const { reviews, ...productData } = product;

        return { 
            ...productData, 
            averageRating, 
            reviewsCount: product.reviews.length 
        };
    }

    async update(id: string, updateProductDto: UpdateProductDto){
        const existingProduct = await this.prisma.product.findUnique({
            where:{id},
        });
        if(!existingProduct) {
            throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
        }

        return this.prisma.product.update({
            where:{id},
            data:updateProductDto,
        });
    }

    async remove(id: string) { 
        const existingProduct = await this.prisma.product.findUnique({
            where:{id},
        });
        if(!existingProduct) {
            throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
        }

        return this.prisma.product.delete({
            where:{id},
        });
    }

}
