import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshDto } from './dto/refresh.dto';     
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

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
                throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
            }
            const newPayload = { email: payload.email, sub: payload.sub };
            const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
            const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

            await this.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { token: refreshToken },
            });

            return { 
                accessToken, 
                refreshToken 
            };
        }
        catch (error) {
            throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
        }
    }

    async signup(signupDto: SignupDto){
        const existingUser = await this.prisma.user.findUnique({
            where: {email: signupDto.email},
        });
        if(existingUser){
            throw new HttpException('User already exists', HttpStatus.CONFLICT);
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

    async login(loginDto: LoginDto) { 
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
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
        return{
            user: user,
            accessToken,
            refreshToken,
        };
    }

    async logout(refreshDto: RefreshDto) { 
        try{
            await this.prisma.refreshToken.delete({ 
                where: { token: refreshDto.refreshToken },
            });
            return { message: 'Logout successful' };
        }
        catch (error) {
            throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
        }
    }
    
    async handleGoogleLogin(req: any) {
  let user = await this.prisma.user.findUnique({
    where: { googleId: req.user.googleId },
  });

  if (!user) {
    user = await this.prisma.user.create({
      data: {
        googleId: req.user.googleId,
        email: req.user.email,
        name: req.user.name,
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
}