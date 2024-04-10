import * as xml from 'xml';
import { Injectable } from '@nestjs/common';
import {
    ContentType,
    HandlerDestination,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { PrimaryHelper } from './primary.helper';
import { Dictionary } from 'src/common/types/general';

@Injectable()
export class PrimaryService {
    /**
     * Process incoming request
     */
    async processRequest(
        inputData: Dictionary,
        paymentSystem: PaymentSystem,
        handlerDestination: HandlerDestination,
    ): Promise<IncomingRequestStatus> {
        const requestPayload = JSON.stringify(inputData);

        const primaryHelper = new PrimaryHelper(
            requestPayload,
            paymentSystem,
            handlerDestination,
        );
        if (await primaryHelper.isDoubleRequest(inputData)) {
            // await primaryHelper.claimDoubleRequest(inputData); @TODO: UNCOMMENT THIS
        }

        await primaryHelper.execute();

        let processingResult: IncomingRequestStatus;

        /**
         * Check whether incoming request has been processed
         */
        if (primaryHelper.isIncomingRequestProcessed) {
            processingResult = IncomingRequestStatus.Processed;
        } else {
            processingResult = IncomingRequestStatus.Failed;
            await primaryHelper.updateIncomingRequestStatus(processingResult);
        }

        return processingResult;
    }

    /**
     * Get response params by payment system
     *
     * @todo: define return type
     */
    getResponseParamsByPaymentSystem(paymentSystem: PaymentSystem) {
        const responseParams = {
            contentType: '', // @todo: Fix this
            payload: { success: true },
        };
        let payload;

        if (responseParams.contentType === ContentType.Xml) {
            payload = xml(responseParams.payload, true);
        } else {
            payload = responseParams.payload;
        }
        return {
            contentType: responseParams.contentType,
            payload,
        };
    }
}
