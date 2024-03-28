import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import DatabaseLogger from 'src/common/providers/logger/database.logger';
import {
    DatabaseLogType,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { GazpromWebhook } from 'src/common/providers/webhook/gazprom/gazprom.webhook';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { incomingRequestRepository } from 'src/database/repositories';
import { HandlerHelper } from './handler.helper';

@Injectable()
export class HandlerService {
    private databaseLogger = DatabaseLogger.getInstance();

    constructor(private readonly helper: HandlerHelper) {}

    /**
     * Process incoming request
     */
    async process(incomingRequestId: number): Promise<void | never> {
        const incomingRequest = await incomingRequestRepository
            .createQueryBuilder()
            .where('id = :id', { id: incomingRequestId })
            .limit(1)
            .getOne();

        if (!(incomingRequest instanceof IncomingRequestEntity)) {
            const logPayload = {
                id: incomingRequestId,
            };
            await this.databaseLogger.write(
                DatabaseLogType.IncomingRequestNotFound,
                logPayload,
            );
            throw new BadRequestException(
                `Incoming request id='${incomingRequestId}' is not found`,
            );
        }
        /**
         * @todo
         * @important
         * Remove the temporary construction below
         */
        await incomingRequestRepository
            .createQueryBuilder()
            .update()
            .set({
                status: IncomingRequestStatus.Received,
            })
            .where('id = :id', { id: incomingRequestId })
            .execute();
        incomingRequest.status = IncomingRequestStatus.Received;
        // ------------- REMOVE CONSTRUCTON ABOVE -------------

        /**
         * Incoming request already processed or failed
         */
        if (incomingRequest.status !== IncomingRequestStatus.Received) {
            const logPayload = {
                id: incomingRequestId,
                status: incomingRequest.status,
                paymentSystem: incomingRequest.paymentSystem,
            };
            await this.databaseLogger.write(
                DatabaseLogType.IncomingRequestProcessedOrFailed,
                logPayload,
            );
            throw new BadRequestException(
                `Incoming request id='${incomingRequestId}' is already processed or failed`,
            );
        }

        if (incomingRequest.paymentSystem === PaymentSystem.Gazprom) {
            const gazpromWebhook = new GazpromWebhook(incomingRequest);
            await gazpromWebhook.execute();
            const executionResult = gazpromWebhook.getExecutionResult();

            if (
                executionResult instanceof Object &&
                executionResult.value.orderProcessed === true
            ) {
                /**
                 * Send order info to external interaction server
                 */
                const payload = {
                    orderId: executionResult.value.orderInstance._id,
                    productOwnerId:
                        executionResult.value.productOwnerInstance._id,
                    finalAmount: executionResult.value.finalAmount,
                    untouchedAmount: executionResult.value.untouchedAmount,
                };
                const externalInteractionData = {
                    paymentSystem: PaymentSystem.Gazprom,
                    payload: JSON.stringify(payload),
                };

                try {
                    /**
                     * @note It's not necessary to await the response
                     */
                    this.helper.sendDataToExternalInteractionServer(
                        externalInteractionData,
                    );
                } catch (error) {
                    /**
                     * @todo: log the case if an error was thrown
                     */
                }
            }
            return;
        }

        const logPayload = {
            id: incomingRequestId,
            paymentSystem: incomingRequest.paymentSystem,
        };
        await this.databaseLogger.write(
            DatabaseLogType.UnknownPaymentSystem,
            logPayload,
        );

        throw new InternalServerErrorException(
            `Unknown payment system '${incomingRequest.paymentSystem}'`,
        );
    }
}
