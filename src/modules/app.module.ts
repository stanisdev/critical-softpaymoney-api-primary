import { APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module, OnModuleDestroy } from '@nestjs/common';
import { PrimaryModule } from './primary/primary.module';
import { typeOrmDataSource } from 'src/database/data-source';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import RegularLogger from 'src/common/providers/logger/regular.logger';
import config from 'src/common/config';
import { LoggerMiddleware } from 'src/common/middlewares/logger.middleware';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: config.rateLimiter.restrictionPeriod,
                limit: config.rateLimiter.maxRequests,
            },
        ]),
        PrimaryModule,
    ],
    providers: [
        /**
         * Global rate limiter
         */
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements OnModuleDestroy {
    private regularLogger = RegularLogger.getInstance();

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }

    async onModuleDestroy() {
        await typeOrmDataSource.destroy();
        this.regularLogger.log('All connections closed');
    }
}
