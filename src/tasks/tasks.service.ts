import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private prisma: PrismaService){}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleExpiredTokensCleanup() {
        this.logger.debug('Cleaning expired tokens...');
        try{
            const currentTime = new Date();
            this.logger.debug(`Current server time : ${currentTime.toISOString()}`);
            this.logger.debug(`Current server timezone : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

            const expiredTokens = await this.prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            this.logger.debug(`Deleted ${expiredTokens} expired tokens`);
            this.logger.debug(`Token cleanup completed. Server time : ${currentTime.toISOString()}, Timezone : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
        } 
        catch (error) {
            this.logger.error('Failed to clean up expired tokens', error.stack);
        }
    }
}
