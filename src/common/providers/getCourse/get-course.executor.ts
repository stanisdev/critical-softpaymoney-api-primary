import { OrderStatus, PaymentSystem } from 'src/common/enums/general';
import { ExternalInteractionDataSource } from 'src/modules/external-interaction/external-interaction.data-source';
import { GetCourseClient } from './get-course.client';

export class GetCourseExecutor {
    constructor(private dataSource: ExternalInteractionDataSource) {}

    /**
     * Run the process of interaction with GetCourse
     */
    async run(): Promise<void> {
        const { order, product: productDbInstance } = this.dataSource;

        if (
            order &&
            order.status === OrderStatus.Confirmed &&
            order.payment?.amount &&
            order.paidAt &&
            order.email &&
            order.payer &&
            productDbInstance.getcourse.status &&
            productDbInstance.getcourse.url &&
            productDbInstance.getcourse.api &&
            productDbInstance.getcourse.product
        ) {
            const pastDate = new Date(+new Date(order.paidAt) - 1209600000); // 14 дней назад
            const day = String(pastDate.getDate()).padStart(2, '0');
            const month = String(pastDate.getMonth() + 1).padStart(2, '0');
            const year = String(pastDate.getFullYear());

            const date = `${year}-${month}-${day}`;
            const getCourseProduct = productDbInstance.getcourse.product;
            const { url } = productDbInstance.getcourse;
            const { api } = productDbInstance.getcourse;
            const { email, payer } = order;
            const { amount } = order.payment;

            let currency: string;
            if (
                order.payment.type === PaymentSystem.Gazprom ||
                order.payment.type === PaymentSystem.Tinkoff
            ) {
                currency = 'RUB';
            } else {
                currency = 'USD';
            }
            const getCourseClient = new GetCourseClient();

            await getCourseClient.createNewTransaction(
                url, // example: yourlaw.getcourse.ru
                api, // example: 2cbFUdyTXAk4w5djQfoEMkZim5HLQqgBZYHTYOnItM1DX6MEDCcScx90SUWZoPisZdgaUB4Fw6akcTNEmZHg23ralzW6odz2uwD0Rn6VQ0SqyuzgETD6GggwcwdcPhQ5
                date,
                email, // order->email
                getCourseProduct,
                amount,
                payer,
                currency,
            );
        }
    }
}
