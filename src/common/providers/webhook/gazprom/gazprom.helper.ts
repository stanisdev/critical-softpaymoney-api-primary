import crypto from 'node:crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { Dictionary } from 'src/common/types/general';
import { typeOrmDataSource } from 'src/database/data-source';
import {
    DatabaseLogType,
    IncomingRequestStatus,
} from 'src/common/enums/general';
import { PaymentTransactionEntity } from 'src/database/entities/paymentTransaction.entity';
import { OrderEntity } from 'src/database/entities/order.entity';
import { MathUtil } from 'src/common/utils/math.util';
import DatabaseLogger from '../../logger/database.logger';

export class GazpromHelper {
    private static databaseLogger = DatabaseLogger.getInstance();

    constructor(private readonly incomingRequest: IncomingRequestEntity) {}

    /**
     * Get commission percent
     */
    getUserCommissionPercents(user: Dictionary): number {
        if (
            user.percents instanceof Object &&
            typeof user.percents.GAZPROM === 'number'
        ) {
            return +user.percents.GAZPROM;
        }
        return 8;
    }

    /**
     * @notice
     * This method was taken from the Legacy API
     * without being changed (as is)
     */
    subtractCommissionFromAmount(
        sum: number,
        percent: number,
        isCommission: boolean,
        additionalCommission?: number,
    ): number {
        const amount = isCommission
            ? sum - (sum * percent) / (1 + percent)
            : sum - sum * percent;
        return MathUtil.ceil10(amount - (additionalCommission || 0), -2);
    }

    parseIncomingRequest(): Dictionary {
        const { incomingRequest } = this;
        let payload: Dictionary;

        try {
            payload = JSON.parse(incomingRequest.payload);
        } catch {
            throw new InternalServerErrorException(
                `Payload of incoming request with id=${incomingRequest.id} cannot be parsed`,
            );
        }
        return payload;
    }

    isSignatureCorrect(
        signature: string,
        url: string,
        certificateContent: string,
    ): boolean {
        const decodedSignature = decodeURIComponent(signature);

        const publicKey = crypto
            .createPublicKey({ key: certificateContent })
            .export({ type: 'spki', format: 'pem' });

        return crypto
            .createVerify('RSA-SHA1')
            .update(url)
            .verify(publicKey, decodedSignature, 'base64');
    }

    /**
     * Create order (original data is taken from Mongo)
     * and create transaction in Postgres
     */
    async completeOrder(params: {
        orderRecord: Dictionary;
        paymentTransactionRecord: Dictionary;
        incomingRequestId: number;
    }): Promise<void> {
        await typeOrmDataSource.manager.transaction(
            'SERIALIZABLE',
            async (transactionalEntityManager) => {
                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(PaymentTransactionEntity)
                    .values(params.paymentTransactionRecord)
                    .execute();
                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(OrderEntity)
                    .values(params.orderRecord)
                    .execute();
                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(IncomingRequestEntity)
                    .set({
                        status: IncomingRequestStatus.Processed,
                    })
                    .where('id = :id', { id: params.incomingRequestId })
                    .execute();
            },
        );
    }

    /**
     * Check correctness of order payment
     */
    async checkOrderPaymentCorrectness(order: Dictionary, product: Dictionary) {
        if (
            !(order.payment instanceof Object) ||
            Object.keys(order.payment).length < 2
        ) {
            await GazpromHelper.databaseLogger.write(
                DatabaseLogType.MongoOrderHasNoPaymentObject,
                {
                    incomingRequestId: this.incomingRequest.id,
                    'order.id': String(order._id),
                    'productOwner.id': product.user,
                },
            );
            throw new InternalServerErrorException(
                `Mongo order has no payment object (orderId: ${order._id})`,
            );
        }
    }
}
