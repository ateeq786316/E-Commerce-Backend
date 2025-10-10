import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(){}

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req){
        console.log("This api got hit =================http://localhost:3000/users/profile=================");
        return req.user;
    }
}
