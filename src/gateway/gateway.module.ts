import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}