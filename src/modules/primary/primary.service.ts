import * as xml from 'xml';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
    ContentType,
    DatabaseLogType,
    HandlerDestination,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { PrimaryHelper } from './primary.helper';
import { GeneralUtil } from 'src/common/utils/general.util';
import { Dictionary } from 'src/common/types/general';
import DatabaseLogger from 'src/common/providers/logger/database.logger';

@Injectable()
export class PrimaryService {
    private databaseLogger = DatabaseLogger.getInstance();

    /**
     * Process incoming request
     */
    async processRequest(
        inputData: Dictionary,
        paymentSystem: PaymentSystem,
        handlerDestination: HandlerDestination,
    ): Promise<IncomingRequestStatus> {
        const requestPayload = JSON.stringify(inputData);

        const helper = new PrimaryHelper(
            requestPayload,
            paymentSystem,
            handlerDestination,
        );
        if (await helper.isDoubleRequest(inputData)) {
            /**
             * If the server received a webhook duplicate
             */
            await this.databaseLogger.write(
                DatabaseLogType.DuplicateIncomingRequest,
                inputData,
            );
            throw new BadRequestException(
                'Order with such ID has been already sent',
            );
        }
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
