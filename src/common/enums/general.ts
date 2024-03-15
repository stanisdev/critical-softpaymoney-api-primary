export enum Сurrency {
    Rub = 'Rub',
    Usd = 'Usd',
    Usdt = 'Usdt',
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
}

export enum PaymentTransactionType {
    Refunded = 'REFUNDED',
    Referral = 'REFERRAL',
    Receiving = 'RECEIVING',
}
