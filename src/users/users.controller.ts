import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(){}

    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req){
        return req.user;
    }
}
