export enum Сurrency {
    Rub = 'MONEY',
    Usd = 'DOLLAR',
    Usdt = 'CRYPTO',
}

export enum IncomingRequestStatus {
    Received = 'RECEIVED',
    Processed = 'PROCESSED',
    Failed = 'FAILED',
}

export enum PaymentSystem {
    Gazprom = 'GAZPROM',
    Tinkoff = 'TINKOFF',
}

export enum DatabaseLogType {
    ServerError = 'server-error',
    IncomingRequestNotFound = 'incoming-request-not-found',
    DuplicateIncomingRequest = 'duplicate-incoming-request',
    IncomingRequestProcessedOrFailed = 'incoming-request-already-processed-or-failed',
    UnknownPaymentSystem = 'unknown-payment-system',
    HandlerHasNotProcessedRequest = 'handler-has-not-processed-request',
    GazpromSignatureIsIncorrect = 'gazprom-signature-is-incorrect',
    OrderInMongoNotFound = 'order-in-mongo-not-found',
    ProductInMongoNotFound = 'product-in-mongo-not-found',
    ProductOwnerInMongoNotFound = 'product-owner-in-mongo-not-found',
    ProductOwnerBalanceInMongoNotFound = 'product-owner-balance-in-mongo-not-found',
    IncomingRequestAmountIsIncorrect = 'incoming-request-amount-is-incorrect',
    MongoOrderHasNoPaymentObject = 'mongo-order-has-no-payment-object',
    CannotParseExternalInteractionPayload = 'cannot-parse-external-interaction-payload',
}

export enum PaymentTransactionType {
    Refunded = 'REFUNDED',
    Referral = 'REFERRAL',
    Receiving = 'RECEIVING',
}

export enum OrderStatus {
    Created = 'CREATED',
    Process = 'PROCESS',
    Rejected = 'REJECTED',
    Refunded = 'REFUNDED',
    Confirmed = 'CONFIRMED',
}

export enum ContentType {
    Json = 'application/json',
    Xml = 'text/xml',
}

export enum BalanceUpdateOperation {
    Increment = 'INCREMENT',
    Decrement = 'DECREMENT',
}

export enum ServerType {
    Primary = 'PRIMARY',
    ExternalInteraction = 'EXTERNAL_INTERACTION',
    Handler = 'HANDLER',
}

export enum PaymentReceiptStatus {
    Sell = 'sell', // приход
    SellRefund = 'sell_refund', // возврат
    Buy = 'buy', // расход
}
