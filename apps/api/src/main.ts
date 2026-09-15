import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Todas as rotas da API ficam sob /api, deixando a raiz livre para o
  // frontend quando os dois forem servidos atras do mesmo dominio.
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
