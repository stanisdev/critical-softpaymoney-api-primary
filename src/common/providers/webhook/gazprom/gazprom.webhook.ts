import {
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { MongoClient } from '../../mongoClient';
import { GazpromHelper } from './gazprom.helper';
import {
    ContentType,
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
import { GazpromDataSource } from './gazprom.data-source';
import RegularLogger from '../../logger/regular.logger';
import DatabaseLogger from '../../logger/database.logger';
import config from 'src/common/config';
import { GazpromExecutionResult } from './gazprom.execution-result';

/**
 * Class to handle Gazprom bank webhooks
 */
export class GazpromWebhook {
    private static regularLogger = RegularLogger.getInstance();
    private static databaseLogger = DatabaseLogger.getInstance();
    private static certificates = {
        signatureVerification: '',
    };
    private mongoClient = MongoClient.getInstance().database;
    private helper: GazpromHelper;
    private dataSource: GazpromDataSource;

    static successfulResponse = {
        payload: [
            {
                'register-payment-response': [
                    { result: [{ code: 1 }, { desc: 'accept payment' }] },
                ],
            },
        ],
        contentType: ContentType.Xml,
    };
    private executionResult: GazpromExecutionResult;

    constructor(private readonly incomingRequest: IncomingRequestEntity) {
        this.helper = new GazpromHelper(incomingRequest);
        this.dataSource = new GazpromDataSource(incomingRequest);
    }

    /**
     * Start processing the incoming request
     */
    async execute(): Promise<void> {
        const payload = this.helper.parseIncomingRequest();
        const incomingRequestId = this.incomingRequest.id;

        /**
         * Signature verification.
         * @notice Need to be completed
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
        const order = await this.dataSource.findOrderByPaymentId(
            <string>orderPaymentId,
        );

        /**
         * Find product in MongoDB
         */
        const product = await this.dataSource.findProductById(order.product);

        /**
         * Find user owning the product
         */
        const productOwner = await this.dataSource.findProductOwnerById(
            product.user,
        );

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

        this.helper.checkOrderPaymentCorrectness(order, product);

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
            const orderRecord = {
                mongoOrderId: String(order._id),
                mongoProductId: String(order.product),
                paymentId: order.payment.id,
                paymentSystem: PaymentSystem.Gazprom,
                paymentAmount: order.payment.amount,
                status: OrderStatus.Rejected,
            };
            await this.helper.completeRejectedOrder({
                orderRecord,
                paymentTransactionRecord,
                incomingRequestId,
            });
            // @todo: add sending webhook to a merchant API (aka: "webhookInitial")
            return;
        }

        /**
         * Calculate royalty
         */
        let finalAmount = commissionSubtractedAmount;
        const royalty = Number.parseFloat(order.royalty);

        if (Number.isInteger(royalty)) {
            finalAmount -= royalty;
        }

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

        /**
         * All checks completed successfully.
         * Proceed completing order.
         */
        const paymentTransactionRecord = {
            userId: String(productOwner._id),
            productId: String(order.product),
            amount: finalAmount,
            orderId: String(order._id),
            type: PaymentTransactionType.Receiving,
        };
        if (!isEmpty(payload['p.maskedPan'])) {
            paymentTransactionRecord['pan'] = payload['p.maskedPan'];
        }
        const orderRecord = {
            mongoOrderId: String(order._id),
            mongoProductId: String(order.product),
            paymentId: order.payment.id,
            paymentSystem: PaymentSystem.Gazprom,
            paymentAmount: order.payment.amount,
            status: OrderStatus.Confirmed,
            paidAt: new Date(),
            updatedAt: new Date(),
        };
        await this.helper.completePaidOrder({
            productOwner,
            productOwnerBalance,
            orderRecord,
            paymentTransactionRecord,
            incomingRequestId,
        });

        /**
         * Create execution result
         */
        this.executionResult = new GazpromExecutionResult({
            orderPaid: true,
            orderInstance: order,
            productOwnerInstance: productOwner,
            finalAmount,
            untouchedAmount,
        });
    }

    getExecutionResult(): GazpromExecutionResult {
        return this.executionResult;
    }

    /**
     * Load certificates from files
     */
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
