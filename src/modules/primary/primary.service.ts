import { Injectable } from '@nestjs/common';
import { incomingRequestRepository } from 'src/database/repositories';
import { IncomingRequestStatus, PaymentSystem } from 'src/common/enums/general';

@Injectable()
export class PrimaryService {
    async basicHandler(
        requestPayload: string,
        paymentSystem: PaymentSystem,
    ): Promise<void> {
        const record = {
            payload: requestPayload,
            status: IncomingRequestStatus.Received,
            paymentSystem,
        };
        await incomingRequestRepository
            .createQueryBuilder()
            .insert()
            .values(record)
            .execute();
    }
}
