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
        return this.prisma.product.create({
            data:{
                ...createProductDto, 
                userId,
            },
        });
    }

    async findAll(paginationDto: PaginationDto, filters: any) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.search) {
            where.name = { contains: filters.search };
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) { 
            where.price = {};
            if (filters.minPrice !== undefined) {
                where.price.gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                where.price.lte = filters.maxPrice;
            }
        }
        if(filters.inStock !== undefined){
            where.inStock = filters.inStock;
        }

        return this.prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
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
