import * as xml from 'xml';
import { Injectable } from '@nestjs/common';
import {
    ContentType,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { PrimaryHelper } from './primary.helper';
import { GeneralUtil } from 'src/common/utils/general.util';

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

    /**
     * Get response params by payment system
     *
     * @todo: define return type
     */
    getResponseParamsByPaymentSystem(paymentSystem: PaymentSystem) {
        const responseParams =
            GeneralUtil.getPaymentSystemResponse(paymentSystem);
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
