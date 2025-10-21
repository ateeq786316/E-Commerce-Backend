import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    private transporter: nodemailer.Transporter;
    private dynamicJobs: Map<string, CronJob> = new Map();

    constructor(
        private prisma: PrismaService, 
        private schedulerRegistry: SchedulerRegistry,
        private googleSheetsService: GoogleSheetsService
    ){
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

    @Cron("* * * 1 * *")
    async handleExpiredTokensCleanup() {
        try{
            const currentTime = new Date();
            this.logger.debug(`Current server time : ${currentTime.toISOString()}`);
            const tokensToBeDeleted = await this.prisma.refreshToken.findMany({
                where: {expiresAt: {lt: new Date(),},},
                select: {
                    id: true,
                    userId: true,
                    token: true,
                    expiresAt: true,
                },
            });

            const expiredTokens = await this.prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {lt: new Date(),},
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
        } 
        catch (error) {
            this.logger.error('Failed to clean up expired tokens', error.stack);
        }
    }

    addDynamicCronJob(name: string, cronExpression: string, callback: () => void): boolean {
        try{
            if(this.dynamicJobs.has(name)){
                this.logger.warn(`Dynamic cron job ${name} already exists`)
                return false;
            }
            const job = new CronJob(cronExpression, callback, null, true);
            this.dynamicJobs.set(name, job);
            job.start();
            this.logger.debug(`Added dynamic cron job ${name} with expression ${cronExpression}`);
            return true;
        }
        catch(error){
            this.logger.error(`Failed to add dynamic cron job ${name}`, error.stack);
            return false;
        }
    }

    updateDynamicJob(name: string, cronExpression: string, callback: () => void): boolean {
        try{
            this.deleteDynamicJob(name);
            return this.addDynamicCronJob(name, cronExpression, callback);
        }
        catch(error){
            this.logger.error(`Failed to update dynamic cron job ${name}`, error.stack);
            return false;
        }
    }

    deleteDynamicJob(name: string): boolean {
        try{
            const job = this.dynamicJobs.get(name);
            if(!job){
                this.logger.warn(`Dynamic cron job ${name} does not exist`);
                return false;
            }
            job.stop();
            this.dynamicJobs.delete(name);
            this.logger.debug(`Deleted dynamic cron job ${name}`);
            return true;
        }
        catch(error){
            this.logger.error(`Failed to delete dynamic cron job ${name}`, error.stack);
            return false;
        }
    }
    
    getAllDynamicJobsNames(): string[]{
        return Array.from(this.dynamicJobs.keys());
    }

    async syncAllProducts() {
        await this.googleSheetsService.syncAllProductsToSheet();
    }
}

