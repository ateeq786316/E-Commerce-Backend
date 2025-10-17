import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: 
  [
    ScheduleModule.forRoot({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } as any),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, 
    PrismaModule, 
    UsersModule, 
    ProductsModule, 
    CategoriesModule, 
    TasksModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
