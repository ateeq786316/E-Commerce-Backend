import { Get, Post, Put, Delete, UseGuards, Body, Param } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
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
    async getAll() {
        console.log("This api got hit getting catogies =================http://localhost:3000/categories/=================");
        return this.categoriesService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create one category' })
    @ApiBearerAuth()
    @ApiBody({ type: CreateCategoryDto })
    async createOne(@Body() createCategoryDto: CreateCategoryDto) {
        console.log("This api got hit creating one category=================http://localhost:3000/categories/=================");
        return this.categoriesService.create(createCategoryDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update one category' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiBody({ type: UpdateCategoryDto })
    async updateOne(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        console.log("This api got hit update category=================http://localhost:3000/categories/:id=================");
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete one category' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Category ID' })
    async deleteOne(@Param('id') id: string) {
        console.log("This delete api got hit removing category=================http://localhost:3000/categories/:id=================");
        return this.categoriesService.remove(id);
    }
}
