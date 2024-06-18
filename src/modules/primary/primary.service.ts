import { Injectable } from '@nestjs/common';
import {
    HandlerDestination,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { PrimaryHelper } from './primary.helper';
import {
    Dictionary,
    PrimaryProcessingRequestResult,
} from 'src/common/types/general';

@Injectable()
export class PrimaryService {
    /**
     * Process incoming request
     */
    async processRequest(
        inputData: Dictionary,
        paymentSystem: PaymentSystem,
        handlerDestination: HandlerDestination,
        metadata?: Dictionary,
    ): Promise<PrimaryProcessingRequestResult> {
        const requestPayload = JSON.stringify(inputData);

        const primaryHelper = new PrimaryHelper(
            requestPayload,
            paymentSystem,
            handlerDestination,
            metadata,
        );
        if (await primaryHelper.isDoubleRequest(inputData)) {
            await primaryHelper.claimDoubleRequest(inputData);
        }

        await primaryHelper.execute();

        /**
         * Check whether incoming request has been processed
         */
        if (primaryHelper.isIncomingRequestProcessed()) {
            /**
             * Successful result looks something like this:
              {
                  payload: [ { 'payment-avail-response': [Array] } ],
                  contentType: 'text/xml'
              }
             */
            const requestResultData = primaryHelper.getRequestResultData();

            return {
                incomingRequestStatus: IncomingRequestStatus.Processed,
                requestResultData,
            };
        } else {
            await primaryHelper.updateIncomingRequestStatus(
                IncomingRequestStatus.Failed,
            );
            return {
                incomingRequestStatus: IncomingRequestStatus.Failed,
                requestResultData: null,
            };
        }
    }
}
