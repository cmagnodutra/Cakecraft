import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppEnvironment } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppEnvironment, true>);

  // Todas as rotas da API ficam sob /api, deixando a raiz livre para o
  // frontend quando os dois forem servidos atras do mesmo dominio.
  app.setGlobalPrefix('api');

  // whitelist remove campos nao declarados no DTO e forbidNonWhitelisted
  // rejeita a requisicao que os enviou, reduzindo a superficie de
  // mass assignment.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  // Permite que o Nest execute onModuleDestroy/onApplicationShutdown ao
  // receber SIGTERM, que e o sinal enviado por "docker stop".
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
