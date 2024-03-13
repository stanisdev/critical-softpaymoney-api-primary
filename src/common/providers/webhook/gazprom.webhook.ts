import { InternalServerErrorException } from '@nestjs/common';
import { Dictionary } from 'src/common/types/general';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';

export class GazpromWebhook {
    constructor(private readonly incomingRequest: IncomingRequestEntity) {}

    async execute(): Promise<void> {
        const { incomingRequest } = this;
        let payload: Dictionary;

        try {
            payload = JSON.parse(incomingRequest.payload);
        } catch {
            throw new InternalServerErrorException(
                `Payload of incoming request with id=${incomingRequest.id} cannot be parsed`,
            );
        }
    }
}
