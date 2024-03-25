import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { EntryPointDto } from './dto/entry-point.dto';
import { Dictionary } from 'src/common/types/general';
import { MongoClient } from 'src/common/providers/mongoClient';

@Injectable()
export class ExternalInteractionService {
    private mongoClient = MongoClient.getInstance().database;

    async execute({
        payload: compressedPayload,
    }: EntryPointDto): Promise<void> {
        let payload: Dictionary;
        try {
            payload = JSON.parse(compressedPayload);
        } catch {
            // @todo: write error with database logger
        }
        /**
            - payload:
            orderId: '65a3f02fc44bff3c38311581',
            productOwnerId: '659a1bf28f3e7ac6602583e3',
            finalAmount: 28,
            untouchedAmount: 30
         */
        const orderId = <string>payload.orderId;
        const productOwnerId = <string>payload.productOwnerId;

        /* eslint-disable */
        const order = await this.mongoClient.collection('orders').findOne({
            _id: new ObjectId(orderId),
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
            return;
        }
        /* eslint-disable */
        const requestPayload = {};
    }
}
