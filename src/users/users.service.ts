import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService){}

    async findOneByEmail(email: string) {
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
    }
    async findOneById(id: string) {
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
    }
}
