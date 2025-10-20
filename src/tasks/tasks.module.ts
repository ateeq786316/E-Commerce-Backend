import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
    imports: [PrismaModule, ScheduleModule, GoogleSheetsModule],
    providers: [TasksService],
    controllers: [TasksController]
})
export class TasksModule {}