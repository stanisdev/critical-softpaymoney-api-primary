import { Module, OnModuleDestroy } from '@nestjs/common';
import { PrimaryModule } from './primary/primary.module';
import { typeOrmDataSource } from 'src/database/data-source';
import RegularLogger from 'src/common/providers/logger/regular.logger';

@Module({
    imports: [PrimaryModule],
})
export class AppModule implements OnModuleDestroy {
    private logger = RegularLogger.getInstance();

    async onModuleDestroy() {
        await typeOrmDataSource.destroy();
        this.logger.log('All connections closed');
    }
}
