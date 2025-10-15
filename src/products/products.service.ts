import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';     
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { UpdateProductDto } from '../auth/dto/update-product.dto';
import { PaginationDto } from 'src/auth/dto/pagination.dto';
import { ReviewDto } from 'src/auth/dto/review.dto';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Multer } from 'multer';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService){}

    async create(userId: string, createProductDto: CreateProductDto) {

        try{
        const created =   await this.prisma.product.create({
            data:{
                ...createProductDto,
                userId,
            },
        });
        if(created)
            return "Product added successfully";
        }
        catch (error) {
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to create product. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findAll(page: { cursor?: string, take?: number }, filters: any) {
        try{
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
        catch(error)
        {
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to retrieve products. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async findOne(id: string) {
    try{
        const product = await this.prisma.product.findUnique({
            where:{id},
            include:{
                category:true,
                images:true,
                reviews:true,
            },
        });

        if(!product){
            throw new HttpException('The Product you are looking for does not exist or has been removed.', HttpStatus.NOT_FOUND);
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
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to retrieve the single product. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto){
        try{
        const existingProduct = await this.prisma.product.findUnique({
            where:{id},
        });
        if(!existingProduct) {
            throw new HttpException('The Product you are trying to update does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }

        const updated = await this.prisma.product.update({
            where:{id},
            data:updateProductDto,
        });
        if(updated){            
            return "Product updated successfully";}
        }
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to update the product. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async remove(userId: string, id: string) {  
        try{
        const existingProduct = await this.prisma.product.findUnique({
            where:{id},
        });
        if(!existingProduct) {
            throw new HttpException('The Product you are trying to delete does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        if(existingProduct.userId !== userId) {
            throw new HttpException('You do not have permission to delete this product.', HttpStatus.UNAUTHORIZED);
        }
        await this.prisma.product.delete({
            where:{id},
        });
        return "Product deleted successfully";
        }
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to delete the product. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createReview(userId: string, productId: string, reviewDto: ReviewDto){
        const Product = await this.prisma.product.findUnique({
            where:{id: productId},
        });
        if(!Product) {
            throw new HttpException('The Product you are trying to review does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }

        try{ 
            const review = await this.prisma.review.upsert({
                where:{
                    userId_productId:{
                        userId: userId,
                        productId: productId,
                    },
                },
                update:{
                    rating: reviewDto.rating,
                    comment: reviewDto.comment,
                },
                create:{
                    rating: reviewDto.rating,
                    comment: reviewDto.comment,
                    userId: userId,
                    productId: productId,
                },
            });
            return "Review added successfully";
        }
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to add your review. Please try again.', HttpStatus.UNAUTHORIZED);
        }
    }

    async deleteReview(userId: string, reviewId: string){
        try{ 
        
        const review = await this.prisma.review.findUnique({
            where:{id: reviewId},
        });
        if(!review) {
            throw new HttpException('The Review you are trying to delete does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        if(review.userId !== userId) {
            throw new HttpException('You do not have permission to delete this review.', HttpStatus.UNAUTHORIZED);
        }
        const deleted = await this.prisma.review.delete({
            where:{id: reviewId},
        });
        if(deleted){
            return "Review deleted successfully";}
        } catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to delete your review. Please try again.', HttpStatus.UNAUTHORIZED);
        }
    }

    async getReviews(productId: string, paginationDto: PaginationDto) {
        try{
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        
        if (!product) {
            throw new HttpException('The Product you are trying to check does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        
        const { page = 1, limit = 10 } = paginationDto;
        const take = limit;
        const skip = (page - 1) * limit;

        const whereclause: any = { productId: productId };
        if(paginationDto.rating !== undefined){
            whereclause.rating = paginationDto.rating;
        }
        
        const reviews = await this.prisma.review.findMany({
            where: { productId: productId },
            take: take,
            skip: skip,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        const total = await this.prisma.review.count({
            where: whereclause,
        });
        
        return {
            data: reviews,
            meta: {
                total: total,
                page: page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }
    catch(error)
    {
        if(error instanceof HttpException){throw error;}
        throw new HttpException('Unable to retrieve reviews. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR);
    }
    }

    async uploadImage(userId: string, productId: string, file: Multer.File) {
        try{
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        
        if (!product) {
            throw new HttpException('The Product you are trying to access does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        if (product.userId !== userId) {
            throw new HttpException('You do not have permission to perform this action.', HttpStatus.UNAUTHORIZED);
        }
        const image = await this.prisma.image.create({
            data: {
                path: `uploads/products/${productId}/${file.filename}`,
                url: `/uploads/products/${productId}/${file.filename}`,
                productId: productId,
            },
        });

        return { message: 'Image uploaded successfully', image: image };
    }
    catch(error){
        if(error instanceof HttpException){throw error;}
        throw new HttpException('Unable to upload the image. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR);
    }
    }

    async deleteImage(userId: string, productId: string, imageId: string) {
        try{
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new HttpException('The Product you are trying to access does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        if (product.userId !== userId) {
            throw new HttpException('You do not have permission to perform this action.', HttpStatus.UNAUTHORIZED);
        }
        const image = await this.prisma.image.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            throw new HttpException('The Image you are trying to delete does not exist or has been removed.', HttpStatus.NOT_FOUND);
        }
        if (image.productId !== productId) {
            throw new HttpException('You do not have permission to delete this image.', HttpStatus.UNAUTHORIZED);
        }
        try{
            const filePath = join(process.cwd(), image.path);
            if(existsSync(filePath)){
                unlinkSync(filePath);
            }
        }
        catch(error){
            throw new HttpException('Unable to delete the image. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        await this.prisma.image.delete({
            where: { id: imageId },
        });
        return { message: 'Image deleted successfully' };
        }
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to delete the image. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
