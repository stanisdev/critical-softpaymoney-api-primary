import { ObjectId } from 'mongodb';
import {
    Dictionary,
    ExternalInteractionPayload,
    MongoDocument,
} from 'src/common/types/general';
import DatabaseLogger from 'src/common/providers/logger/database.logger';
import HTTPMethod from 'http-method-enum';
import config from 'src/common/config';
import { DatabaseLogType } from 'src/common/enums/general';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { MongoClient } from 'src/common/providers/mongoClient';
import { GeneralUtil } from 'src/common/utils/general.util';
import { HttpClient } from '../httpClient';

export class MerchantWebhookInteraction {
    private payload: ExternalInteractionPayload;
    private databaseLogger = DatabaseLogger.getInstance();
    private mongoClient = MongoClient.getInstance().database;
    private order: MongoDocument;
    private product: MongoDocument;
    private merchantWebhook: MongoDocument;
    private webhookIsAvailable = true;
    private webhookRequestPayload: Dictionary;

    constructor(private compressedPayload: string) {}

    /**
     * Start the process
     */
    async execute() {
        this.parseCompressedPayload();
        await this.fillDataSource();

        if (!this.webhookIsAvailable) {
            return;
        }
        this.buildWebhookPayload();
        await this.sendPayloadToWebhook();
    }

    /**
     * Send payload to the Merchant webhook API
     */
    async sendPayloadToWebhook(): Promise<void> {
        const httpClient = new HttpClient({
            url: this.merchantWebhook.link,
            body: this.webhookRequestPayload,
            method: HTTPMethod.POST,
            timeout: config.timeout.merchantWebhook,
        });
        const requestResult = await httpClient.sendRequest();
        const { webhookRequestPayload, merchantWebhook } = this;

        /**
         * Create record in 'webhook_journals' collection
         */
        const webhookJournalRecord = {
            url: merchantWebhook.link,
            order: this.order._id,
            webhook: merchantWebhook._id,
            requestBody: webhookRequestPayload,
            responseBody: JSON.stringify(
                requestResult.message || { non: 'data' },
            ),
            statusCode: requestResult.statusCode,
            amount: webhookRequestPayload.amount,
            paidAmount: webhookRequestPayload.paidAmount,
            createdAt: new Date(),
        };
        const insertResult = await this.mongoClient
            .collection('webhook_journals')
            .insertOne(webhookJournalRecord);

        const webhookJournalMetadata = {
            id: String(insertResult.insertedId),
            order: String(this.order._id),
        };

        /**
         * If request failed
         */
        if (
            requestResult.ok !== true ||
            requestResult.statusCode !== HttpStatus.OK
        ) {
            await this.scheduleWebhookExecution(webhookJournalMetadata);
        }
    }

    /**
     * Schedule not handled merchant webhook
     */
    private async scheduleWebhookExecution({
        order,
    }: Dictionary): Promise<void> {
        const [lastWebhookJournalInstance] = await this.mongoClient
            .collection('webhook_journals')
            .find({
                order: new ObjectId(<string>order),
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        /**
         * 24 hours agowebhookJournalRecord
         */
        const limitDate = new Date(
            new Date().setDate(new Date().getDate() - 1),
        );
        if (
            !(lastWebhookJournalInstance instanceof Object) ||
            new Date(lastWebhookJournalInstance.createdAt).getTime() <
                limitDate.getTime()
        ) {
            // @todo: remove all 'webhook journal' records from Mongo
            return;
        }
        /**
         * 1 hour (in milliseconds)
         */
        const oneHour = 1000 * 60 * 60;

        setTimeout(() => {
            new MerchantWebhookInteraction(this.compressedPayload).execute();
        }, oneHour);
    }

    /**
     * Build payload for request to a merchant webhook
     */
    private buildWebhookPayload(): void {
        const promoCode = this.product.promocodes?.find(
            (element: Dictionary) => element.id === this.order.promocode?.id,
        );
        const { order, product, payload } = this;

        this.webhookRequestPayload = {
            paidAt: new Date(order.paidAt as Date).toISOString(),
            promocodeName: promoCode?.name || '',
            promocodeType: promoCode?.type || '',
            recurrent: !!order.recurrent?.status,
            productLink: product?.link,
            paidAmount: payload.finalAmount,
            payerPhone: order.phone,
            payerEmail: order.email,
            payer: order.payer,
            type: order.payment?.type,
            amount: payload.untouchedAmount,
            status: order.status,
            token: '',
        };
        const signatureHashPayload = Object.entries({
            ...this.webhookRequestPayload,
            secret: this.merchantWebhook.secret,
        })
            .sort()
            .reduce(
                (accumulationString: string, key) =>
                    accumulationString + String(key.pop()),
                '',
            );

        this.webhookRequestPayload.token =
            GeneralUtil.generateSha256Hash(signatureHashPayload);
        this.webhookRequestPayload.data = order.customData;

        this.webhookRequestPayload.questions = order.questions.map(
            (question: Dictionary) => {
                const result = {
                    question: question?.name,
                    answer: question?.answer,
                };
                return result;
            },
        );
        this.webhookRequestPayload.paymentId = order.payment.id;
    }

    /**
     * Parse raw, 'stringified' payload
     */
    private parseCompressedPayload(): void | never {
        try {
            this.payload = JSON.parse(this.compressedPayload);
        } catch {
            this.databaseLogger.write(
                DatabaseLogType.CannotParseExternalInteractionPayload,
                {
                    payload: this.compressedPayload,
                },
            );
            throw new InternalServerErrorException(
                'Cannot parse external interaction payload',
            );
        }
    }

    /**
     * Get necessary records from MongoDB
     *
     * find: order, product, merchantWebhook
     */
    private async fillDataSource(): Promise<void> {
        const orderId = <string>this.payload.orderId;
        const productOwnerId = <string>this.payload.productOwnerId;

        this.order = await this.mongoClient.collection('orders').findOne({
            _id: new ObjectId(orderId),
        });
        this.product = await this.mongoClient.collection('products').findOne({
            _id: this.order.product,
        });
        const merchantWebhook = await this.mongoClient
            .collection('webhooks')
            .findOne({
                user: new ObjectId(productOwnerId),
            });
        if (
            !(merchantWebhook instanceof Object) ||
            typeof merchantWebhook.secret !== 'string' ||
            !merchantWebhook.verified
        ) {
            this.webhookIsAvailable = false;
            return;
        }
        this.merchantWebhook = merchantWebhook;
    }
}
