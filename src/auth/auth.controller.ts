import { Body, Controller } from '@nestjs/common';
import { Get, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { RefreshDto } from './dto/refresh.dto';



@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: SignupDto })
    @ApiResponse({ status: 200, description: 'User successfully registered' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
    @Post('signup')
    async register(@Body() signupDto: SignupDto) {
        console.log("This api got hit =================http://localhost:3000/auth/signup=================");
        return this.authService.signup(signupDto);
        
    }

    @ApiOperation({ summary: 'Log in an existing user' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'User logged in' })
    @ApiResponse({ status: 400, description: 'Bad request- validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        console.log("This api got hit =================http://localhost:3000/auth/login=================");
        // console.log("loginDto", loginDto);
        return this.authService.login(loginDto);
    }
    

    @ApiOperation({ summary: 'Log out an existing user' })
    @ApiBearerAuth()
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 200, description: 'User logged out' })
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: any) {
        console.log("This api got hit =================http://localhost:3000/auth/logout=================");
        return this.authService.logout(req.user.id);
    }

    @ApiOperation({ summary: 'Log in an existing user with Google' })
    @ApiResponse({ status: 302, description: 'Redirect to Google login page' })
    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    async googleAuth(@Req() req: any) {}

    @ApiOperation({ summary: 'Log in an existing user with Google callback' })
    @ApiResponse({ status: 200, description: 'User logged in with Google' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Google login failed'})
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any) {
        console.log("This api got hit =================http://localhost:3000/auth/google/callback=================");
        return this.authService.handleGoogleLogin(req);
    }

}
