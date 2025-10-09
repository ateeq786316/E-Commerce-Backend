import { Body, Controller } from '@nestjs/common';
import { Get, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}


    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 200, description: 'User registered' })
    @Post('signup')
    async register(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
        
    }

    @ApiOperation({ summary: 'Log in an existing user' })
    @ApiResponse({ status: 200, description: 'User logged in' })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
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
    @UseGuards(GoogleOAuthGuard)
    async googleAuth(@Req() req: any) {}

    @ApiOperation({ summary: 'Log in an existing user with Google callback' })
    @ApiResponse({ status: 200, description: 'User logged in with Google' })
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any) {
        return this.authService.handleGoogleLogin(req);
    }

}
