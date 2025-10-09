import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateCategoryDto } from '../auth/dto/create-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryDto } from 'src/auth/dto/update-category.dto';



@Injectable()
export class CategoriesService {
    constructor(private prismaService: PrismaService){}

    async create(createCategoryDto: CreateCategoryDto) {
        return this.prismaService.category.create({
            data: createCategoryDto,
        });
    }
    async findAll() {
        return this.prismaService.category.findMany({
            orderBy:{createdAt:'desc'},
        });
    }
    async findOne(id: string) {
        const category = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!category) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const existingCategory = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!existingCategory) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

        try{
        return this.prismaService.category.update({
            where:{id},
            data: updateCategoryDto,
        });
        } catch(error){
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    async remove(id: string) {
        const existingCategory = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!existingCategory) throw new HttpException('Category not found', HttpStatus.NOT_FOUND);

        try{
        return await this.prismaService.category.delete({
            where:{id},
        });
        } catch(error){
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
