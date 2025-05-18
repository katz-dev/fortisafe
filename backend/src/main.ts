import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Standard whitelist for specific origins
  const whitelist = [
    'http://localhost:3000', // Your standard frontend origin
    'chrome-extension://lmkkjkgocfciicgheedmnpidkdbjmmfj',
    'chrome-extension://apclocdencjjilfhinacbmacadmkogbb',
    // Add any other specific origins you need to support
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Auto-allow any chrome-extension:// origin
      if (origin.startsWith('chrome-extension://')) {
        callback(null, true);
        return;
      }

      // Check against whitelist for non-extension origins
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
        return;
      }

      // Log rejected origins during development to help debugging
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Auth-Token',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      // Add any other custom headers your frontend might send
    ],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      // Add any custom headers your backend might send that frontend needs to access
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600, // Cache preflight response for 1 hour
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('Authentication and User Management API')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('passwords')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();