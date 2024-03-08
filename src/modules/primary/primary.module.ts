import { Module } from '@nestjs/common';
import { PrimaryController } from './primary.controller';

@Module({
    controllers: [PrimaryController],
    providers: [],
})
export class PrimaryModule {}
