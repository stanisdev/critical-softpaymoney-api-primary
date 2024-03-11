import { Injectable } from '@nestjs/common';
import { typeOrmDataSource } from 'src/database/data-source';
import { BalanceEntity } from 'src/database/entities/balance.entity';
import { balanceRepository } from 'src/database/repositories';
import { Сurrency } from 'src/common/types/general';
import { PaymentTransactionEntity } from 'src/database/entities/paymentTransaction.entity';

@Injectable()
export class PrimaryService {
    async basicHandler() {
        await typeOrmDataSource.manager.transaction(
            'SERIALIZABLE',
            async (transactionalEntityManager) => {
                const balanceRecord = {
                    value: 10,
                    currencyType: Сurrency.Rub,
                    userId: '63e794a3fdfb9e440a688e76',
                };
                const paymentTransactionRecord = {
                    userId: '63e2cd04847c01ff9a071b3b',
                    productId: '63e4039e83eb8b1b89f6be90',
                    orderId: '63e8f18fd703ca5f8762f2c6',
                    amount: 1587,
                    type: 'RECEIVING',
                };
                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(BalanceEntity)
                    .values(balanceRecord)
                    .execute();

                await transactionalEntityManager
                    .createQueryBuilder()
                    .insert()
                    .into(PaymentTransactionEntity)
                    .values(paymentTransactionRecord)
                    .execute();
            },
        );

        const balance = await balanceRepository.findOneBy({
            id: 2,
        });
        console.log(balance);
    }
}
