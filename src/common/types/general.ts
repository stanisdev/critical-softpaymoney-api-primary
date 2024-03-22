import { Document, WithId } from 'mongodb';

export type Dictionary = {
    [key: string]: string | number | Date | Dictionary;
};

export type SuccessfulResponse = {
    ok: boolean;
};

export type AxiosResponse<T> = {
    status: number;
    data: T;
};

export type HttpRequestResult = {
    ok: boolean;
    message?: string;
    data?: Dictionary;
};

export type MongoDocument = WithId<Document>;

export type MerchantApiParameters = {
    order: MongoDocument;
    productOwner: MongoDocument;
    finalAmount: number;
    untouchedAmount: number;
};
