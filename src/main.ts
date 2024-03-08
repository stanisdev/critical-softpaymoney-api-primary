import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LogLevel, LoggerService } from '@nestjs/common';
import { AppModule } from './modules/app.module';

import RegularLogger from './common/providers/logger/regular.logger';
import helmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import config from './common/config';
import { typeOrmDataSource } from 'src/database/data-source';

async function bootstrap() {
    const logger = RegularLogger.getInstance();
    const loggerOptions: LoggerService | LogLevel[] =
        process.env.NODE_ENV === 'production'
            ? logger
            : ['warn', 'error', 'verbose'];
    /**
     * Establish database connection
     */
    try {
        await typeOrmDataSource.initialize();
    } catch (databaseConnectionError) {
        logger.error(databaseConnectionError, 'Cannot connect to database');
        process.exit(1);
    }
    logger.log('Database connected');

    /**
     * Build application instance
     */
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

    /**
     * Handle the event of app being terminated
     */
    process.on('SIGINT', () => {
        logger.log('Server forcibly stopped');
    });
}
bootstrap();
