import { Controller } from '@nestjs/common';
import { Get, Req } from '@nestjs/common';
import { Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor() {}

    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 200, description: 'User registered' })
    @Post('signup')
    async register() {
        return 'User registered';
    }

    @ApiOperation({ summary: 'Log in an existing user' })
    @ApiResponse({ status: 200, description: 'User logged in' })
    @Post('login')
    async login() {
        return 'User logged in';
    }

    @ApiOperation({ summary: 'Log out an existing user' })
    @ApiResponse({ status: 200, description: 'User logged out' })
    @Post('logout')
    async logout() {
        return 'User logged out';
    }

    @ApiOperation({ summary: 'Log in an existing user with Google' })
    @ApiResponse({ status: 200, description: 'User logged in with Google' })
    @Get('google')
    async googleAuth(@Req() req) {
        return 'User logged in with Google';
    }

    @ApiOperation({ summary: 'Log in an existing user with Google callback' })
    @ApiResponse({ status: 200, description: 'User logged in with Google' })
    @Get('google/callback')
    async googleAuthRedirect(@Req() req) {
        return 'User logged in with Google';
    }

}
