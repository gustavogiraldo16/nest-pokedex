import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v2');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // This will remove any properties that are not in the DTO
      forbidNonWhitelisted: true, // This will throw an error if any properties are not in the DTO
      transform: true, // This will transform the data to the DTO type
      transformOptions: {
        enableImplicitConversion: true, // This will convert query params to their respective types
      },
    }),
  )

  await app.listen(3000);

}
bootstrap();
