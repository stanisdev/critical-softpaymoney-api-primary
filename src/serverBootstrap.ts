import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import RegularLogger from './common/providers/logger/regular.logger';
import helmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import config from './common/config';
import { LogLevel, LoggerService, ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { typeOrmDataSource } from 'src/database/data-source';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { handlerPortRepository } from './database/repositories';

export class ServerBootstrap {
    private static instance: ServerBootstrap | null = null;
    private regularLogger = RegularLogger.getInstance();
    private app: NestFastifyApplication;
    private port: number;

    private constructor() {}

    /**
     * Get instance of the class
     */
    static getInstance(): ServerBootstrap {
        if (!(ServerBootstrap.instance instanceof ServerBootstrap)) {
            return (ServerBootstrap.instance = new ServerBootstrap());
        }
        return ServerBootstrap.instance;
    }

    /**
     * Start the server
     */
    async start() {
        await this.connectPostgres();

        /**
         * Build application instance
         */
        this.app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter(),
            {
                cors: true,
                logger: this.getNestLoggerOptions(),
            },
        );

        await this.applicationSetup();
        await this.defineServerTypeAndPort();
        await this.listen();

        this.serverShutdownHook();
    }

    /**
     * Define server type and port
     */
    private async defineServerTypeAndPort(): Promise<void> {
        this.port = config.server.port.primary;
    }

    /**
     * Start listening
     */
    private async listen() {
        await this.app.listen(this.port);
        this.regularLogger.log(
            `Server started at port ${this.port} as 'PRIMARY'`,
        );
    }

    /**
     * Assembling application
     */
    private async applicationSetup(): Promise<void> {
        const { app } = this;

        await app.register(helmet);
        await app.register(fastifyCsrf);

        app.enableShutdownHooks();
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalPipes(new ValidationPipe());
    }

    /**
     * Establish Postgres connection
     */
    private async connectPostgres(): Promise<void> {
        try {
            await typeOrmDataSource.initialize();
        } catch (postgresConnectionError) {
            this.regularLogger.error(
                postgresConnectionError,
                'Cannot connect to Postgres',
            );
            process.exit(1);
        }
        this.regularLogger.log('Postgres connected');
    }

    /**
     * Get Nest logger options
     */
    private getNestLoggerOptions(): LoggerService | LogLevel[] {
        return config.environment.isProd()
            ? this.regularLogger
            : ['warn', 'error', 'verbose'];
    }

    /**
     * Method to be executed when the server stopped
     */
    async destroy(): Promise<void> {
        await handlerPortRepository
            .createQueryBuilder()
            .delete()
            .where('value = :port', { port: this.port })
            .execute();
    }

    /**
     * Handle the event of app being terminated
     */
    private serverShutdownHook() {
        process.on('SIGINT', () => {
            this.regularLogger.log('Server forcibly stopped');
        });
    }
}
