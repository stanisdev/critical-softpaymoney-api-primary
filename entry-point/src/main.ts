import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LogLevel, LoggerService } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import helmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import RegularLogger from './common/providers/logger/regular.logger';

async function bootstrap() {
    const logger = RegularLogger.getInstance();
    const loggerOptions: LoggerService | LogLevel[] = process.env.NODE_ENV === 'production'
        ? logger
        : ['warn', 'error', 'verbose'];

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
        {
            cors: true,
            logger: loggerOptions,
        },
    );

    await app.register(helmet);
    await app.register(fastifyCsrf);
    app.enableShutdownHooks();

    await app.listen(5000);
    logger.log('Server started at port: ' + 5000);
}
bootstrap();
