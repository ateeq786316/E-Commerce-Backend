import { Controller, Post, Get } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';


@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(){}

    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    @Get('profile')
    async getProfile(){}
}
