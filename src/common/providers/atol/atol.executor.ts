import { ExternalInteractionDataSource } from 'src/modules/external-interaction/external-interaction.data-source';
import { AtolClient } from './atol.client';
import { OrderStatus, PaymentSystem } from 'src/common/enums/general';
import { MongoClient } from '../mongoClient';

export class AtolExecutor {
    private mongoClient = MongoClient.getInstance().database;

    constructor(private dataSource: ExternalInteractionDataSource) {}

    /**
     * Run the process of interaction with atol
     */
    async run(): Promise<void> {
        const { order } = this.dataSource;
        /**
         * Validation
         */
        if (
            order.payment.type !== PaymentSystem.Gazprom &&
            order.payment.type !== PaymentSystem.Tinkoff
        ) {
            return;
        }
        if (order.status !== OrderStatus.Confirmed) {
            return;
        }

        /**
         * Define paymentId
         */
        let paymentId: string;
        if (order.payment.type === PaymentSystem.Gazprom) {
            paymentId = order.payment.trx_id;
        } else {
            paymentId = order.payment.id;
        }

        /**
         *  Define rebill
         */
        let rebill: string;
        if (order.recurrent.rebill) {
            rebill = `-${order.recurrent.rebill}`;
        } else {
            rebill = '';
        }

        /**
         * @notice
         * These two constants was taken from the Legacy as is
         */
        const operationId = {
            sell: 'S-',
            sell_refund: 'SR-',
        };
        const paymentType = {
            GAZPROM: 'G-',
            TINKOFF: 'T-',
        };

        /**
         * @notice
         * This is a workaround and should be modified in the future
         */
        const operationType = 'sell';

        /**
         * Send HTTP request to atol
         */
        const atolClient = new AtolClient();
        const userContacts = { Email: order.email, Phone: order.phone };
        const productName = order.product.name;
        const paymentAmount = order.payment.amount;
        const operationPaymentId = `${paymentType[order.payment.type]}${operationId[operationType]}${paymentId}${rebill}`;

        const receipt = await atolClient.CreateOperation(
            operationType,
            operationPaymentId,
            productName,
            paymentAmount,
            userContacts,
        );
        /**
         * Handle atol response
         */
        const requestResult = {
            uuid: receipt?.data?.uuid,
            status: receipt?.data?.status,
        };

        if (requestResult.uuid) {
            const report = await atolClient.getReport(requestResult.uuid);
            requestResult.status = report?.data?.status;
        }

        const fieldsToUpdate = {
            'receipt.uuid': requestResult.uuid ? requestResult.uuid : '',
            'receipt.status': requestResult.status ? requestResult.status : '',
        };
        await this.mongoClient.collection('orders').updateOne(
            { _id: order._id },
            {
                $set: fieldsToUpdate,
            },
        );
    }
}
