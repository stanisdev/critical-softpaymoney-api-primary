import { Injectable } from '@nestjs/common';
import { IncomingRequestStatus, PaymentSystem } from 'src/common/enums/general';
import { PrimaryHelper } from './primary.helper';

@Injectable()
export class PrimaryService {
    /**
     * Process incoming request
     */
    async processRequest(
        requestPayload: string,
        paymentSystem: PaymentSystem,
    ): Promise<IncomingRequestStatus> {
        const helper = new PrimaryHelper(requestPayload, paymentSystem);
        await helper.execute();

        let processingResult: IncomingRequestStatus;

        /**
         * Check whether incoming request has been processed
         */
        if (helper.isIncomingRequestProcessed) {
            processingResult = IncomingRequestStatus.Processed;
        } else {
            processingResult = IncomingRequestStatus.Failed;
            await helper.updateIncomingRequestStatus(processingResult);
        }

        return processingResult;
    }
}
