import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ){}

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

        
    }


}
