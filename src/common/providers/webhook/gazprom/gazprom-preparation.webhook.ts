import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import DatabaseLogger from '../../logger/database.logger';
import { MongoClient } from '../../mongoClient';
import { Dictionary } from 'src/common/types/general';
import {
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { GazpromDataSource } from './gazprom.data-source';
import { GazpromPaymentStatus } from 'src/common/enums/general';

export class GazpromPreparationWebhook {
    private static databaseLogger = DatabaseLogger.getInstance();
    private mongoClient = MongoClient.getInstance().database;
    private dataSource: GazpromDataSource;

    constructor(private readonly incomingRequest: IncomingRequestEntity) {
        this.dataSource = new GazpromDataSource(incomingRequest);
    }

    /**
     * Start processing the incoming request
     */
    async execute(): Promise<void> {
        const { payload } = this.incomingRequest;
        const orderPaymentId = payload['o.CustomerKey'];

        this.validatePaymentStatus();

        /**
         * Find order in MongoDB
         */
        const order = await this.dataSource.findOrderByPaymentId(
            <string>orderPaymentId,
        );

        let payloadData: Dictionary;
        if (order instanceof Object) {
            payloadData = {
                code: 1,
                desc: 'Payment accepted',
                longDesc: `Оплата продукта: "${order.product.name}"`, // @todo: fix this
                amount: Number(order.payment.amount),
                currency: 643, // Трехзначный цифровой код валюты (ISO 4217)
                exponent: 2, // Экспонента валюты платежа (ISO 4217)
                trxId: 'oldTrx ??????', // @todo: fix this also
            };
        } else {
            payloadData = {
                code: 2,
                desc: 'Unable to accept this payment',
            };
        }

        /**
         * Define final result
         */
        const responseData = [];

        responseData.push({
            result: [{ code: payloadData.code }, { desc: payloadData.desc }],
        });

        if (payloadData.code === 1 && Number.isInteger(payloadData.amount)) {
            /**
             * purchase.account-amount.id - Идентификатор счета в системе магазина. Возвращается в запросе регистрации платежа (RPReq) в исходном виде
             * purchase.account-amount.amount - Сумма платежа в минорных единицах
             */
            responseData.push({
                purchase: [
                    { longDesc: payloadData.longDesc }, // "Проверка доступности платежа в магазине" - сделай поиск по документации
                    {
                        'account-amount': [
                            { id: process.env.GAZPROM_MERCH_ID }, // @todo: fix this - get from the config
                            { amount: +payloadData.amount * 100 },
                            { currency: payloadData.currency },
                            { exponent: payloadData.exponent },
                        ],
                    },
                ],
            });
            if (payload['o.PaymentStatus'] === GazpromPaymentStatus.Auto) {
                /**
                 * card - Описание ранее зарегистрированной карты или ранее проведённой транзакции
                 * card.id - Идентификатор банковской карты, которая должна использоваться в платеже
                 * card.trx-id - Идентификатор транзакции, из которой необходимо брать параметры банковской карты
                 * card.present - Идентификатор типа платежа. Параметр может принимать следующие значения:
                 *                  Y – обычный платеж без повторного ввода параметров карты (по умолчанию)
                 *                  N – рекуррентный платеж
                 */
                responseData.push({
                    card: [{ 'trx-id': payloadData.trxId }, { present: 'N' }],
                });
            }
        }
        const finalResult = [
            { 'payment-avail-response': responseData }, // Стр. 50 из 64 - Документация (v1_32)
        ];
    }

    /**
     * Validate payment status
     */
    validatePaymentStatus(): void | never {
        const isPaymentStatusCorrect = [
            GazpromPaymentStatus.New,
            GazpromPaymentStatus.Auto,
        ].includes(this.incomingRequest.payload['o.PaymentStatus']);
        if (!isPaymentStatusCorrect) {
            throw new BadRequestException('Unacceptable payment status');
        }
    }
}
