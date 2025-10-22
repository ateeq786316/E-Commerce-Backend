import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService){}

    async findOneByEmail(email: string) {
        try{
        const user= await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if(user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
        } catch (error) {
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to find your account. Please check information and Try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findOneById(id: string) {
        try{
        
        const user= await this.prisma.user.findUnique({
            where: {
                id,
            },
        });
        if(user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
        } catch (error) {
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to find your account. Please check information and Try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findAllExceptCurrent(currentUserId: string){
        try{
            const users= await this.prisma.user.findMany({
                where:{
                    NOT:{
                        id: currentUserId
                    }
                },
                select:{
                    id: true,
                    name: true,
                    email: true,
                }
            });
            return users;
        } catch (error) {
            if(error instanceof HttpException){throw error;}
            throw new HttpException('Unable to retrieve users.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
