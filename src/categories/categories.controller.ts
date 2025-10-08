import { Get, Post, Put, Delete } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor() {}

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'All categories returned' })
    async getAll() {
        return 'All categories returned';
    }

    @Post()
    @ApiOperation({ summary: 'Create one category' })
    @ApiResponse({ status: 200, description: 'One category created' })
    async createOne() {
        return 'One category created';
    }

    @Put()
    @ApiOperation({ summary: 'Update one category' })
    @ApiResponse({ status: 200, description: 'One category updated' })
    async updateOne(id: string) {
        return 'One category updated';
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete one category' })
    @ApiResponse({ status: 200, description: 'One category deleted' })
    async deleteOne(id: string) {
        return 'One category deleted';
    }
}
