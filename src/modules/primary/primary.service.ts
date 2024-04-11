import * as xml from 'xml';
import { Injectable } from '@nestjs/common';
import {
    ContentType,
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
    ): Promise<PrimaryProcessingRequestResult> {
        const requestPayload = JSON.stringify(inputData);

        const primaryHelper = new PrimaryHelper(
            requestPayload,
            paymentSystem,
            handlerDestination,
        );
        if (await primaryHelper.isDoubleRequest(inputData)) {
            /**
             * @notice
             * @important
             * @todo: UNCOMMENT LINE BELOW
             */
            // await primaryHelper.claimDoubleRequest(inputData);
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

    /**
     * Compile reply parameters (Content type & Payload)
     */
    compileReplyParams(requestResultData: Dictionary) {
        let payload;

        if (requestResultData.contentType === ContentType.Xml) {
            payload = xml(<string>requestResultData.payload, true);
        } else {
            payload = requestResultData.payload;
        }
        return {
            contentType: requestResultData.contentType,
            payload,
        };
    }
}
