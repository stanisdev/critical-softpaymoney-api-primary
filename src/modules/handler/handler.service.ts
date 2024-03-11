import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { PaymentSystem } from 'src/common/enums/general';
import { GazpromWebhook } from 'src/common/providers/webhook/gazprom.webhook';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { incomingRequestRepository } from 'src/database/repositories';

@Injectable()
export class HandlerService {
    async process(incomingRequestId: number) {
        const incomingRequest = await incomingRequestRepository
            .createQueryBuilder()
            .where('id = :id', { id: incomingRequestId })
            .limit(1)
            .getOne();

        if (!(incomingRequest instanceof IncomingRequestEntity)) {
            // @todo: log with the DB logger
            throw new BadRequestException(
                `Incoming request id='${incomingRequestId}' is not found`,
            );
        }
        if (incomingRequest.paymentSystem === PaymentSystem.Gazprom) {
            await new GazpromWebhook(incomingRequest).execute();
            return;
        }
        // @todo: log with the DB logger
        throw new InternalServerErrorException(
            `Unknown payment system '${incomingRequest.paymentSystem}'`,
        );
    }
}
