import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LogLevel, LoggerService, ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';

import RegularLogger from './common/providers/logger/regular.logger';
import helmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import config from './common/config';
import { typeOrmDataSource } from 'src/database/data-source';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { GazpromWebhook } from './common/providers/webhook/gazprom/gazprom.webhook';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { GeneralUtil } from './common/utils/general.util';
import { MongoClient } from './common/providers/mongoClient';

async function bootstrap() {
    const logger = RegularLogger.getInstance();
    const loggerOptions: LoggerService | LogLevel[] =
        process.env.NODE_ENV === 'production'
            ? logger
            : ['warn', 'error', 'verbose'];
    /**
     * Establish databases connections
     */
    try {
        await typeOrmDataSource.initialize();
    } catch (postgresConnectionError) {
        logger.error(postgresConnectionError, 'Cannot connect to Postgres');
        process.exit(1);
    }
    logger.log('Postgres connected');

    try {
        await MongoClient.getInstance().connect();
    } catch (mongoConnectionError) {
        logger.error(mongoConnectionError, 'Cannot connect to Mongo');
        process.exit(1);
    }
    logger.log('Mongo connected');

    GazpromWebhook.loadCertificates();

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
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalPipes(new ValidationPipe());

    /**
     * Define server port and type
     */
    const server = {
        port: 0,
        type: '',
    };
    if (config.server.isPrimary()) {
        server.port = config.server.port.primary;
        server.type = 'Primary';
    } else {
        /**
         * If server started as 'Handler'
         */
        const leastPort = config.server.port.handler;
        for (let index = 0; index < 10; index++) {
            const port = leastPort + index;
            const isPortInUse = await GeneralUtil.isPortInUse(port);

            if (!isPortInUse) {
                server.port = port;
                break;
            }
        }
        if (server.port === 0) {
            logger.log(
                `Server cannot be started since ports from ${leastPort} to ${leastPort + 10} are already in use`,
            );
            process.exit(1);
        }
        server.type = 'Handler';
    }

    await app.listen(server.port);
    logger.log(`Server started at port ${server.port} as '${server.type}'`);

    /**
     * Handle the event of app being terminated
     */
    process.on('SIGINT', () => {
        logger.log('Server forcibly stopped');
    });
}
bootstrap();
