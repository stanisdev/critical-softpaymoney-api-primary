import { MongoDocument } from 'src/common/types/general';

export class GazpromExecutionResult {
    constructor(
        public value: {
            orderPaid: boolean;
            orderInstance: MongoDocument;
            productOwnerInstance: MongoDocument;
            finalAmount: number;
            untouchedAmount: number;
        },
    ) {}
}
