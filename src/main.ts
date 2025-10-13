import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'),{
    prefix: '/uploads',
  });
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('The E-Commerce API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Enter JWT token',
            in: 'header',
      }
    )
    .addTag('E-Commerce')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  
  app.useGlobalPipes(new ValidationPipe(
    {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }
  ));
  app.enableCors({
        origin: 'http://localhost:3000', 
        credentials: true, 
      });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
