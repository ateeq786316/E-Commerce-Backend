import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateCategoryDto } from '../auth/dto/create-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryDto } from 'src/auth/dto/update-category.dto';



@Injectable()
export class CategoriesService {
    constructor(private prismaService: PrismaService){}

    async create(createCategoryDto: CreateCategoryDto) {
        try{
        const existingCategory = await this.prismaService.category.findFirst({
            where:{
                name: 
                {
                    equals: createCategoryDto.name,
                    mode: 'insensitive',
                }
            },
        });
        if(existingCategory)
        {throw new HttpException('Category already exists', HttpStatus.CONFLICT);}

        const created = await this.prismaService.category.create({
            data: {
                ...createCategoryDto,
                name: createCategoryDto.name.trim(),
                description: createCategoryDto.description.trim(),
            }
        });
        if(created)
            {return 'Category created successfully';}
        } catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to create category. Please try again.', HttpStatus.BAD_REQUEST);
        }    
    }
    
    async findAll() {
        try{
        return this.prismaService.category.findMany({
            orderBy:{createdAt:'desc'},
        });
        }
        catch(error){throw new HttpException('Unable to retrieve categories. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)}
    }
    
    async findOne(id: string) {
        try{
        const category = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!category) throw new HttpException('The category not found, doesnt exist or have been removed', HttpStatus.NOT_FOUND);
        return category;
        } 
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to retrieve this category. Please try again.',HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const existingCategory = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!existingCategory) throw new HttpException('The category you are tying to update not found, doesnt exist or have been removed', HttpStatus.NOT_FOUND);

        try{
        const updated= await this.prismaService.category.update({
            where:{id},
            data: updateCategoryDto,
        });
        if(updated)
            {return 'Category updated successfully';} 
        } catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to update category. Please try again.', HttpStatus.BAD_REQUEST);
        }
    }

    async remove(id: string) {
        const existingCategory = await this.prismaService.category.findUnique({
            where:{id},
        });
        if(!existingCategory) throw new HttpException('The category you are tying to delete not found, doesnt exist or have been removed', HttpStatus.NOT_FOUND);

        try{
        const deleted = await this.prismaService.category.delete({where:{id},});
        if(deleted) 
            {
                return { message: 'Category deleted successfully' };
            }
        } 
        catch(error){
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to delete category. Please try again.', HttpStatus.BAD_REQUEST);
        }
        
    }
}
