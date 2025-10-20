import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';


@Module({
  imports: 
  [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, 
    PrismaModule, 
    UsersModule, 
    ProductsModule, 
    CategoriesModule, 
    TasksModule, GoogleSheetsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
