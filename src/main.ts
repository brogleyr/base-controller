import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // //Dynamically allow cors, you can add the url here?
  // app.enableCors({
  //   origin: (origin, callback) => {
  //     const allowedOrigins = [
  //                             configService.get<string>('CORS_ALLOWED_URL_1') || 'http://localhost:5173',
  //                             configService.get<string>('CORS_ALLOWED_URL_1') || 'https://example.com'
  //                           ];
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'), false);
  //     }
  //   },
  //   credentials: true, // Optional: if your frontend needs to send cookies or authentication information
  // });

  // Allow CORS for all origins
  app.enableCors({
    origin: true, // This will allow all origins
    // credentials: true, // Optional: if your frontend needs to send cookies or authentication information
  });

  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    console.log('[Raw Headers]', req.rawHeaders);
    console.log('[Headers]', req.headers);
    console.log('[Query Params]', req.query);
    console.log('[Body]', req.body);

    const apiKey = configService.get<string>('WEBHOOK_API_KEY');
    const requestApiKey = req.headers['x-api-key'];

    if (apiKey && (!requestApiKey || requestApiKey !== apiKey)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Base Controller API Client')
    .setDescription('API client for the Base Controller')
    .setVersion('1.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;
  // const host = configService.get<string>('HOST') || '0.0.0.0';
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
