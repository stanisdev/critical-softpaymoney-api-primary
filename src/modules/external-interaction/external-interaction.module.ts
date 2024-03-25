import { Module } from '@nestjs/common';
import { ExternalInteractionController } from './external-interaction.controller';
import { ExternalInteractionService } from './external-interaction.service';

@Module({
    controllers: [ExternalInteractionController],
    providers: [ExternalInteractionService],
})
export class ExternalInteractionModule {}
