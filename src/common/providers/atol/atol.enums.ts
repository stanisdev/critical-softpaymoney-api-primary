export enum RequestMethod {
    GETTOKEN = 'getToken',
    REPORT = 'report',
}

export enum PaymentInfo {
    SNO = 'usn_income_outcome',
    PAYMENT_METHOD = 'full_payment',
    QUANTITY = 1,
    MEASURE = 0,
    PAYMENT_OBJECT = 'service',
    PAYMENTS_TYPE = 1,
    VAT_TYPE = 'none',
}

// eslint-disable-line no-use-before-define
export enum StatusReceipt {
    DONE = 'done', // готово;
    FAIL = 'fail', // ошибка;
    WAIT = 'wait', // ожидание;
}
