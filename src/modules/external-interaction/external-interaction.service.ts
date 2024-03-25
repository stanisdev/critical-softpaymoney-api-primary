import { Injectable } from '@nestjs/common';
import { EntryPointDto } from './dto/entry-point.dto';
import { MerchantWebhookInteraction } from 'src/common/providers/external-interactions/merchant-webhook.interaction';

@Injectable()
export class ExternalInteractionService {
    async execute({
        payload: compressedPayload,
    }: EntryPointDto): Promise<void> {
        const merchantWebhook = new MerchantWebhookInteraction(
            compressedPayload,
        );
        await merchantWebhook.execute();
    }
}
