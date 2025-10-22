import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshDto } from './dto/refresh.dto';     
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { console } from 'inspector';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ){}

    async refreshToken(token: string) { 
        try{

            const payload= this.jwtService.verify(token);
            const storedToken = await this.prisma.refreshToken.findUnique({
                where: { token: token },
            });
            if (!storedToken) {
                throw new HttpException('Your session has expired. Please login again.', HttpStatus.UNAUTHORIZED);
            }

            if (storedToken.expiresAt < new Date()) {
                throw new HttpException('Your session has expired. Please login again.', HttpStatus.UNAUTHORIZED);
            }

            const newPayload = { email: payload.email, sub: payload.sub };
            const accessToken = this.jwtService.sign(newPayload, { expiresIn: '25m' });
            const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '50m' });

            await this.prisma.refreshToken.delete({ where: { id: storedToken.id } })

            await this.prisma.refreshToken.create({
                data: { 
                    token: refreshToken, 
                    userId: storedToken.userId, 
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                },
            });

            return { 
                accessToken, 
                refreshToken 
            };
        }
        catch (error) {
            throw new HttpException('Unable to refresh your session, please login again.', HttpStatus.UNAUTHORIZED);
        }
    }

    async signup(signupDto: SignupDto){
        try{
        const existingUser = await this.prisma.user.findUnique({
            where: {email: signupDto.email},
        });
        if(existingUser){
            throw new HttpException('An account with this email already exists. Please try logging in with other email instead.', HttpStatus.CONFLICT);
        }

        const hashedPassword = await bcrypt.hash(signupDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: signupDto.email,
                name: signupDto.name,
                password: hashedPassword,
            },
        });

        const payload = { email: user.email, sub: user.id };
        const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
        const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        const { password, ...userWithoutPassword } = user;
        return { 
            user: userWithoutPassword ,
            accessToken, 
            refreshToken,
        };
        }
        catch (error) {
            throw new HttpException('Unable to create your account. Please check information and Try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(loginDto: LoginDto) { 
        try{
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new HttpException('Invalid email or password. Please check your credentials and try again.', HttpStatus.UNAUTHORIZED);
        }
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' }) ;
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }) ;

        await this.prisma.refreshToken.create({ 
            data: 
            { 
                token: refreshToken, 
                userId: user.id, 
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            } 
        });

        const { password, ...userWithoutPassword } = user;
        return{
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
        
        }
        catch (error) {
            throw new HttpException('Unable to Login. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async logout(userId: string) { 
        try{
            await this.prisma.refreshToken.deleteMany({
                where: { 
                    userId: userId,
                },
            });
            return { message: "You have successfully logged out" };
           }
        catch (error) {
            throw new HttpException('Unable to log you out. Please try again.', HttpStatus.UNAUTHORIZED);
        }
    }
    
    async handleGoogleLogin(req: any) {
    try{ 
        
    let user = await this.prisma.user.findUnique({
        where: { googleId: req.user.email },
    });
    if(user && !user.googleId)
    {
        user = await this.prisma.user.update({
            where: { email: req.user.email },
            data: { googleId: req.user.googleId },
        });
    }
    else if (!user) {
        user = await this.prisma.user.create({
            data: {
                email: req.user.email,
                name: req.user.name,
                googleId: req.user.googleId,
            },
        });
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.refreshToken.create({
        data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    const { password, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
    }
        catch (error) {
                throw new HttpException('Unable to complete Google authentication. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
    }
}