import { Module, OnModuleDestroy } from '@nestjs/common';
import { PrimaryModule } from './primary/primary.module';
import { typeOrmDataSource } from 'src/database/data-source';
import { HandlerModule } from './handler/handler.module';
import RegularLogger from 'src/common/providers/logger/regular.logger';
import config from 'src/common/config';

@Module({
    imports: [...AppModule.getModules()],
})
export class AppModule implements OnModuleDestroy {
    private logger = RegularLogger.getInstance();

    async onModuleDestroy() {
        await typeOrmDataSource.destroy();
        this.logger.log('All connections closed');
    }

    /**
     * Get list of modules needed to be loaded
     */
    static getModules() {
        const serveModuleParam = process.env.SERVE_MODULE;
        let modules: (typeof PrimaryModule)[] = [];

        if (config.environment.isDev()) {
            modules.push(PrimaryModule, HandlerModule);
        } else if (serveModuleParam === 'entry-point') {
            modules.push(PrimaryModule);
        } else if (serveModuleParam === 'handler') {
            modules.push(HandlerModule);
        } else {
            throw new Error(
                `Server started with lack of necessary 'env' variables`,
            );
        }
        return modules;
    }
}
