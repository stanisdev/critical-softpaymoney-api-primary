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
import config from './common/config';

async function bootstrap() {
    const logger = RegularLogger.getInstance();
    const loggerOptions: LoggerService | LogLevel[] =
        process.env.NODE_ENV === 'production'
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

    const serverPort = config.server.port;
    await app.listen(serverPort);
    logger.log('Server started at port: ' + serverPort);
}
bootstrap();
