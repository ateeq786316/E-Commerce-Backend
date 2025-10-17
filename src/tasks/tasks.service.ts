import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    private transporter: nodemailer.Transporter;

    constructor(private prisma: PrismaService){
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'ateeq786316@gmail.com', 
                pass: 'hawd lskz qlyq dohz',   
            },
        });
    }

    @Cron("10 * * * * *")
    async handleExpiredTokensCleanup() {
        // this.logger.debug('Cleaning expired tokens...');
        try{
            const currentTime = new Date();
            this.logger.debug(`Current server time : ${currentTime.toISOString()}`);
            // this.logger.debug(`Current server timezone : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

            const tokensToBeDeleted = await this.prisma.refreshToken.findMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
                select: {
                    id: true,
                    userId: true,
                    token: true,
                    expiresAt: true,
                },
            });

            const expiredTokens = await this.prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });

            if (tokensToBeDeleted.length > 0) {
                try {
                    await this.transporter.sendMail({
                        from: 'ateeq786316@gmail.com', 
                        to: 'ateeq786316@gmail.com', 
                        subject: 'Expired Tokens Cleanup Report',
                        text: `Deleted ${tokensToBeDeleted.length} expired tokens at ${currentTime.toISOString()}`,
                        html: `
                            <h2>Refresh Token Cleanup Report</h2>
                            <p><strong>Time:</strong> ${currentTime.toISOString()}</p>
                            <p><strong>Tokens Deleted:</strong> ${tokensToBeDeleted.length}</p>
                            <h3>Deleted Token Details:</h3>
                            <ul>
                                ${tokensToBeDeleted.map(token => 
                                    `<li>Token ID: ${token.id.substring(0, 8)}... - User ID: ${token.userId} - Expires: ${token.expiresAt.toISOString()}</li>`
                                ).join('')}
                            </ul>
                        `
                    });
                    this.logger.debug(`Email notification sent for ${tokensToBeDeleted.length} deleted tokens`);
                } catch (emailError) {
                    this.logger.error('Failed to send email notification', emailError.stack);
                }
            }
            else {
                this.logger.debug('No expired tokens found');
            }

            this.logger.debug(`Deleted ${expiredTokens.count} expired tokens`);
            // this.logger.debug(`Token cleanup completed. Server time : ${currentTime.toISOString()}, Timezone : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
        } 
        catch (error) {
            this.logger.error('Failed to clean up expired tokens', error.stack);
        }
    }
}
