import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}

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

    // @UseGuards(JwtAuthGuard)
    @Get('list')
    async getAllUsers(@Request() req){ 
        try{
            const currentUserId = req.user.id;

            const users= await this.usersService.findAllExceptCurrent(currentUserId);
            return users;
        }
        catch(error){
            return error.response;
        }
    }
}
