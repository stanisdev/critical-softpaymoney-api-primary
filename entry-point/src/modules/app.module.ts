import { Module } from '@nestjs/common';
import { PrimaryModule } from './primary/primary.module';

@Module({
    imports: [PrimaryModule],
})
export class AppModule {}
