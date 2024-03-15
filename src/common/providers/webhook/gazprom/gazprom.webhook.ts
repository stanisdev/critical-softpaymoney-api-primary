import { InternalServerErrorException } from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { MongoClient } from '../../mongoClient';
import { GazpromHelper } from './gazprom.helper';
import { typeOrmDataSource } from 'src/database/data-source';
import { PaymentTransactionEntity } from 'src/database/entities/paymentTransaction.entity';
import { PaymentTransactionType } from 'src/common/enums/general';

export class GazpromWebhook {
    private mongoClient = MongoClient.getInstance().database;
    private helper: GazpromHelper;

    constructor(private readonly incomingRequest: IncomingRequestEntity) {
        this.helper = new GazpromHelper(incomingRequest);
    }

    /**
     * Start processing the incoming request
     */
    async execute(): Promise<void> {
        const payload = this.helper.parseIncomingRequest();

        // @todo: add signature verification

        const orderPaymentId = payload['o.CustomerKey'];

        const order = await this.mongoClient.collection('orders').findOne({
            'payment.id': orderPaymentId,
        });
        if (!(order instanceof Object)) {
            // @todo: log the situation if order not found
            throw new InternalServerErrorException(
                `Order not found (payment.id = "${orderPaymentId}")`,
            );
        }

        const product = await this.mongoClient.collection('products').findOne({
            _id: order.product,
        });
        if (!(product instanceof Object)) {
            // @todo: log the situation if product not found
            throw new InternalServerErrorException(
                `Product not found (id = "${order.product}")`,
            );
        }

        const productOwner = await this.mongoClient
            .collection('users')
            .findOne({
                _id: product.user,
            });
        if (!(productOwner instanceof Object)) {
            // @todo: log the situation if product owner not found
            throw new InternalServerErrorException(
                `Product owner not found (id = "${product.user}")`,
            );
        }
        const percents = this.helper.getUserPercents(productOwner);

        /**
         * Run Postgres transaction
         */
        await typeOrmDataSource.manager.transaction(
            'SERIALIZABLE',
            async (transactionalEntityManager) => {
                // const balanceRecord = {
                //     value: 10,
                //     currencyType: Сurrency.Rub,
                //     userId: '63e794a3fdfb9e440a688e76',
                // };
                const paymentTransactionRecord = {
                    userId: String(productOwner._id),
                    productId: String(product._id),
                    orderId: String(order._id),
                    amount: 1587,
                    type: PaymentTransactionType.Receiving,
                };
                // await transactionalEntityManager
                //     .createQueryBuilder()
                //     .insert()
                //     .into(BalanceEntity)
                //     .values(balanceRecord)
                //     .execute();

                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(PaymentTransactionEntity)
                    .values(paymentTransactionRecord)
                    .execute();
            },
        );
    }
}
