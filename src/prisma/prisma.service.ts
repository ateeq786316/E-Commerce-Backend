import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma';
@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);
  constructor(private config: ConfigService) {
        super({
            datasources:{
                db:{
                    url:config.get('DATABASE_URL'),
                    
                } 
            }
        });
    }
}