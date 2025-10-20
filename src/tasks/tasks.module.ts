import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';

@Module({
    imports: [PrismaModule, ScheduleModule],
    providers: [TasksService],
    controllers: [TasksController]
})
export class TasksModule {}
