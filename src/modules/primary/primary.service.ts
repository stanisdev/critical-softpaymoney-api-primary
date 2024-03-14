import HttpMethod from 'http-method-enum';
import { HttpStatus, Injectable } from '@nestjs/common';
import { incomingRequestRepository } from 'src/database/repositories';
import {
    DatabaseLogType,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { HttpClient } from 'src/common/providers/httpClient';
import { Dictionary } from 'src/common/types/general';
import DatabaseLogger from 'src/common/providers/logger/database.logger';
import config from 'src/common/config';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';

@Injectable()
export class PrimaryService {
    private databaseLogger = DatabaseLogger.getInstance();

    /**
     * Process incoming request
     */
    async processRequest(
        requestPayload: string,
        paymentSystem: PaymentSystem,
    ): Promise<IncomingRequestStatus> {
        const incomingRequest = new IncomingRequestEntity();
        incomingRequest.payload = requestPayload;
        incomingRequest.status = IncomingRequestStatus.Received;
        incomingRequest.paymentSystem = paymentSystem;

        await incomingRequestRepository.save(incomingRequest);

        /**
         * Send request to a handler server
         */
        const hasRequestProcessed = await this.sendRequestToHandler({
            incomingRequestId: incomingRequest.id,
        });

        let result: IncomingRequestStatus;
        if (hasRequestProcessed) {
            result = IncomingRequestStatus.Processed;
        } else {
            result = IncomingRequestStatus.Failed;
        }
        /**
         * Update incoming request status in DB
         */
        await incomingRequestRepository
            .createQueryBuilder()
            .update()
            .set({
                status: result,
            })
            .where('id = :id', { id: incomingRequest.id })
            .execute();

        return result;
    }

    /**
     * Send http request to a Handler server
     */
    private async sendRequestToHandler(body: Dictionary): Promise<boolean> {
        for (let index = 0; index < 10; index++) {
            const port = config.server.port.handler + index;
            const url = `http://localhost:${port}/handler`;

            const httpClient = new HttpClient({
                url,
                body,
                method: HttpMethod.POST,
                timeout: config.timeout.handler,
            });
            const requestResult = await httpClient.sendRequest();
            if (
                requestResult.ok === true &&
                requestResult?.data?.statusCode === HttpStatus.OK
            ) {
                /**
                 * If incoming request has been process return true
                 */
                const incomingRequestStatus =
                    await this.getIncomingRequestStatus(
                        <number>body.incomingRequestId,
                    );
                if (incomingRequestStatus === IncomingRequestStatus.Processed) {
                    return true;
                }
            } else {
                /**
                 * Request to a nadler server failed
                 */
                const logPayload = {
                    hadlerPort: port,
                    incomingRequestId: body.incomingRequestId,
                    message: requestResult.message,
                };
                await this.databaseLogger.write(
                    DatabaseLogType.HandlerHasNotProcessedRequest,
                    logPayload,
                );
            }
        }
        return false;
    }

    /**
     * Get incoming request status
     */
    private async getIncomingRequestStatus(
        id: number,
    ): Promise<IncomingRequestStatus> {
        const incomingRequest = await incomingRequestRepository
            .createQueryBuilder()
            .where('id = :id', { id })
            .limit(1)
            .getOne();
        return incomingRequest.status;
    }
}
