import { Get, Post, Put, Delete, UseGuards, Body, Param } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from '../auth/dto/update-category.dto';
import { CreateCategoryDto } from '../auth/dto/create-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'All categories returned' })
    async getAll() {
        return this.categoriesService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create one category' })
    @ApiResponse({ status: 200, description: 'One category created' })
    async createOne(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update one category' })
    @ApiResponse({ status: 200, description: 'One category updated' })
    async updateOne(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete one category' })
    @ApiResponse({ status: 200, description: 'One category deleted' })
    async deleteOne(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
