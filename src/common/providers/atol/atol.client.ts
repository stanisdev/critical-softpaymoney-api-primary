import axios, { Axios } from 'axios';
import {
    InitialPaymentReport,
    InitialPaymentResponse,
    InitialPaymentResponseToken,
} from './atol.interfaces';
import config from 'src/common/config';
import { PaymentInfo, RequestMethod } from './atol.enums';
import { AtolOperation } from './atol.types';

export class AtolClient {
    private login: string;
    private password: string;
    private groupCode: string;
    private companyEmail: string;
    private inn: string;
    private paymentUrl: string;
    private axios: Axios;

    /**
     * Build the client instance
     */
    constructor() {
        this.login = config.atol.login;
        this.password = config.atol.password;
        this.groupCode = config.atol.groupCode;
        this.companyEmail = config.atol.companyEmail;
        this.inn = config.atol.inn;
        this.paymentUrl = config.atol.paymentUrl;
        this.axios = axios.create({
            baseURL: config.atol.url,
        });
    }

    /**
     * Get auth token
     */
    async getToken(): Promise<InitialPaymentResponseToken> {
        try {
            const data = {
                login: this.login,
                pass: this.password,
            };
            const config = {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            };
            const response = await this.axios.post(
                `/${RequestMethod.GETTOKEN}`,
                data,
                config,
            );
            return {
                status: true,
                data: response.data,
                success: response.data.token ? true : false,
                message: response.data.token
                    ? 'OK'
                    : response.data.error.text
                      ? response.data.error.text
                      : 'error getToken',
            };
        } catch (error: any) {
            console.log(error);
            return {
                status: false,
                data: error?.response?.data ? error?.response?.data : null,
                success: false,
                message: error?.response?.data.error.text
                    ? error?.response?.data.error.text
                    : 'error getToken',
            };
        }
    }

    /**
     * Create check
     */
    async CreateOperation(
        operation: AtolOperation,
        paymentId: string,
        name: string,
        amount: number,
        userContacts: { Email: string; Phone: string },
    ): Promise<InitialPaymentResponse> {
        try {
            const token = await this.getToken();
            if (token.status && token.data?.token && token.data?.timestamp) {
                const data = {
                    timestamp: token.data.timestamp,
                    external_id: paymentId,
                    receipt: {
                        client: {
                            email: userContacts.Email
                                ? userContacts.Email
                                : 'none',
                            phone: userContacts.Phone
                                ? userContacts.Phone
                                : 'none',
                        },
                        company: {
                            email: this.companyEmail,
                            sno: PaymentInfo.SNO,
                            inn: this.inn,
                            payment_address: this.paymentUrl,
                        },
                        items: [
                            {
                                name: name,
                                price: amount,
                                quantity: PaymentInfo.QUANTITY,
                                measure: PaymentInfo.MEASURE,
                                sum: amount,
                                payment_method: PaymentInfo.PAYMENT_METHOD,
                                payment_object: PaymentInfo.PAYMENT_OBJECT,
                                vat: {
                                    type: PaymentInfo.VAT_TYPE,
                                },
                                user_data: paymentId,
                            },
                        ],
                        payments: [
                            {
                                type: PaymentInfo.PAYMENTS_TYPE,
                                sum: amount,
                            },
                        ],
                        total: amount,
                    },
                };
                const config = {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        Token: token.data.token,
                    },
                };
                const response = await this.axios.post(
                    `/${this.groupCode}/${operation}`,
                    data,
                    config,
                );
                return {
                    status: true,
                    data: response.data,
                    success:
                        response.data.uuid && response.data.status === 'wait'
                            ? true
                            : false,
                    message:
                        response.data.uuid && response.data.status === 'wait'
                            ? 'OK'
                            : response.data.error.text
                              ? response.data.error.text
                              : 'error CreateOperation',
                };
            } else {
                return {
                    status: false,
                    data: token.data,
                    success: token.success,
                    message: token.message,
                };
            }
        } catch (error: any) {
            console.log(error);
            return {
                status: false,
                data: error?.response?.data ? error?.response?.data : null,
                success: false,
                message: error?.response?.data.error.text
                    ? error?.response?.data.error.text
                    : 'error CreateOperation',
            };
        }
    }

    /**
     * Get information about the check and a link to the check
     */
    async getReport(uuid: string): Promise<InitialPaymentReport> {
        try {
            const token = await this.getToken();
            if (token.status && token.data?.token && token.data?.timestamp) {
                const config = {
                    headers: {
                        Token: token.data.token,
                    },
                };
                const response = await this.axios.get(
                    `/${this.groupCode}/${RequestMethod.REPORT}/${uuid}`,
                    config,
                );
                return {
                    status: true,
                    data: response.data,
                    success:
                        response.data.uuid && response.data.status === 'done'
                            ? true
                            : false,
                    message:
                        response.data.uuid && response.data.status === 'done'
                            ? 'OK'
                            : response.data.error.text
                              ? response.data.error.text
                              : 'error getReport',
                };
            } else {
                return {
                    status: false,
                    data: token.data,
                    success: token.success,
                    message: token.message,
                };
            }
        } catch (error: any) {
            console.log(error);
            return {
                status: false,
                data: error?.response?.data ? error?.response?.data : null,
                success: false,
                message: error?.response?.data.error.text
                    ? error?.response?.data.error.text
                    : 'error getReport',
            };
        }
    }
}
