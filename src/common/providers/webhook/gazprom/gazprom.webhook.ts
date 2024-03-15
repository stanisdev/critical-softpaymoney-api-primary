import {
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { MongoClient } from '../../mongoClient';
import { GazpromHelper } from './gazprom.helper';
import { typeOrmDataSource } from 'src/database/data-source';
import { PaymentTransactionEntity } from 'src/database/entities/paymentTransaction.entity';
import {
    DatabaseLogType,
    IncomingRequestStatus,
    PaymentTransactionType,
} from 'src/common/enums/general';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import RegularLogger from '../../logger/regular.logger';
import config from 'src/common/config';
import { incomingRequestRepository } from 'src/database/repositories';
import DatabaseLogger from '../../logger/database.logger';

export class GazpromWebhook {
    private static regularLogger = RegularLogger.getInstance();
    private static databaseLogger = DatabaseLogger.getInstance();
    private static certificates = {
        signatureVerification: '',
    };
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
        const incomingRequestId = this.incomingRequest.id;

        /**
         * Signature verification.
         * @notice: Need to be completed
         */
        const url = '?';
        const signature = '?';
        let isSignatureCorrect: boolean;
        try {
            isSignatureCorrect = this.helper.isSignatureCorrect(
                signature,
                url,
                GazpromWebhook.certificates.signatureVerification,
            );
        } catch {
            isSignatureCorrect = true; // <---- @todo: replace by 'false'
        }
        if (!isSignatureCorrect) {
            /**
             * Sugnature is incorrect
             */
            await incomingRequestRepository
                .createQueryBuilder()
                .update()
                .set({
                    status: IncomingRequestStatus.Failed,
                })
                .where('id = :id', { id: this.incomingRequest.id })
                .execute();

            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.GazpromSignatureIsIncorrect,
                {
                    incomingRequestId,
                },
            );
            throw new BadRequestException('Signature is incorrect');
        }

        const orderPaymentId = payload['o.CustomerKey'];

        /**
         * Find order in MongoDB
         */
        const order = await this.mongoClient.collection('orders').findOne({
            'payment.id': orderPaymentId,
        });
        if (!(order instanceof Object)) {
            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.OrderInMongoNotFound,
                {
                    incomingRequestId,
                    'order.payment.id': orderPaymentId,
                },
            );
            throw new InternalServerErrorException(
                `Order not found (payment.id = "${orderPaymentId}")`,
            );
        }
        /**
         * Find product in MongoDB
         */
        const product = await this.mongoClient.collection('products').findOne({
            _id: order.product,
        });
        if (!(product instanceof Object)) {
            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.ProductInMongoNotFound,
                {
                    incomingRequestId,
                    'product.id': order.product,
                },
            );
            throw new InternalServerErrorException(
                `Product not found (id = "${order.product}")`,
            );
        }
        /**
         * Find user owning the product
         */
        const productOwner = await this.mongoClient
            .collection('users')
            .findOne({
                _id: product.user,
            });
        if (!(productOwner instanceof Object)) {
            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.ProductOwnerInMongoNotFound,
                {
                    incomingRequestId,
                    'product.id': order.product,
                    'productOwner.id': product.user,
                },
            );
            throw new InternalServerErrorException(
                `Product owner not found (id = "${product.user}")`,
            );
        }
        const percents = this.helper.getUserPercents(productOwner);

        return;
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

    static loadCertificates() {
        const certificateFilePath = join(
            config.dirs.keys,
            'signature',
            config.gazprom.certificateFileName,
        );
        try {
            statSync(certificateFilePath);
        } catch {
            this.regularLogger.error(
                `Cannot read certificate: ${certificateFilePath}`,
            );
            process.exit(1);
        }
        this.certificates.signatureVerification = readFileSync(
            certificateFilePath,
            { encoding: 'utf-8' },
        );
    }
}
