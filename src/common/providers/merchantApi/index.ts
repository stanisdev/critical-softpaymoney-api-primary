import { MerchantApiParameters } from 'src/common/types/general';
// import { MongoClient } from 'src/common/providers/mongoClient';

export class MerchantApi {
    constructor(private params: MerchantApiParameters) {}

    async sendOrderInfoToWebhook() {
        // const merchantWebhookInfo = {};
    }
}
