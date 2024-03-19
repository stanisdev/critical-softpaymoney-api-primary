import {
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { MongoClient } from '../../mongoClient';
import { GazpromHelper } from './gazprom.helper';
import {
    DatabaseLogType,
    IncomingRequestStatus,
    OrderStatus,
    PaymentSystem,
    PaymentTransactionType,
    Сurrency,
} from 'src/common/enums/general';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { incomingRequestRepository } from 'src/database/repositories';
import { isEmpty } from 'lodash';
import RegularLogger from '../../logger/regular.logger';
import DatabaseLogger from '../../logger/database.logger';
import config from 'src/common/config';

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

        /**
         * Get order amount (price)
         */
        const inputAmount = Number.parseFloat(<string>payload.amount);
        if (Number.isNaN(inputAmount)) {
            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.IncomingRequestAmountIsIncorrect,
                {
                    incomingRequestId,
                    orderId: String(order._id),
                    'product.id': order.product,
                    'productOwner.id': product.user,
                    amount: payload.amount,
                },
            );
            throw new InternalServerErrorException(
                `Amount value ("${payload.amount}") is not a number `,
            );
        }
        const commissionPercents =
            this.helper.getUserCommissionPercents(productOwner);

        const untouchedAmount = inputAmount / 100;
        const commissionSubtractedAmount = Math.floor(
            this.helper.subtractCommissionFromAmount(
                untouchedAmount,
                commissionPercents / 100,
                order.commission,
            ),
        );

        /**
         * If order was rejected
         */
        if (payload.result_code === '2') {
            const paymentTransactionRecord = {
                userId: String(productOwner._id),
                productId: String(order.product),
                amount: commissionSubtractedAmount,
                orderId: String(order._id),
                type: PaymentTransactionType.Receiving,
            };
            if (!isEmpty(payload['p.maskedPan'])) {
                paymentTransactionRecord['pan'] = payload['p.maskedPan'];
            }
            /**
             * Mongo order record is incorrect
             */
            if (
                !(order.payment instanceof Object) ||
                Object.keys(order.payment).length < 2
            ) {
                await GazpromWebhook.databaseLogger.write(
                    DatabaseLogType.MongoOrderHasNoPaymentObject,
                    {
                        incomingRequestId,
                        'order.id': String(order._id),
                        'productOwner.id': product.user,
                    },
                );
                throw new InternalServerErrorException(
                    `Mongo order has no payment object (orderId: ${order._id})`,
                );
            }
            const orderRecord = {
                mongoOrderId: String(order._id),
                mongoProductId: String(order.product),
                paymentId: order.payment.id,
                paymentSystem: PaymentSystem.Gazprom,
                paymentAmount: order.payment.amount,
                status: OrderStatus.Rejected,
            };
            await this.helper.completeOrder({
                orderRecord,
                paymentTransactionRecord,
                incomingRequestId,
            });
        }

        /**
         * ==============
         * Succesful flow
         * ==============
         */
        // await this.helper.confirmOrder();

        /**
         * Find product owner balance record
         */
        const productOwnerBalance = await this.mongoClient
            .collection('payments')
            .findOne({
                user: product.user,
                type: Сurrency.Rub,
            });
        if (!(productOwnerBalance instanceof Object)) {
            await GazpromWebhook.databaseLogger.write(
                DatabaseLogType.ProductOwnerBalanceInMongoNotFound,
                {
                    incomingRequestId,
                    'productOwner.id': product.user,
                    currencyType: Сurrency.Rub,
                },
            );
            throw new InternalServerErrorException(
                `Product owner balance not found (id = "${product.user}")`,
            );
        }

        // const royalty = {
        //     TINKOFF: order.royalty,
        //     GAZPROM: order.royalty,
        //     PRODAMUS: 0,
        //     CRYPTO: 0,
        //   };

        // const currentAmount = amount - royalty[order.payment.type];
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
