export enum Сurrency {
    Rub = 'MONEY',
    Usd = 'DOLLAR',
    Usdt = 'CRYPTO',
}

export enum IncomingRequestStatus {
    Received = 'Received',
    Processed = 'Processed',
    Failed = 'Failed',
}

export enum PaymentSystem {
    Gazprom = 'Gazprom',
}

export enum DatabaseLogType {
    ServerError = 'server-error',
    IncomingRequestNotFound = 'incoming-request-not-found',
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
