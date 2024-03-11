import { typeOrmDataSource } from '../data-source';
import { BalanceEntity } from '../entities/balance.entity';
import { PaymentTransactionEntity } from '../entities/paymentTransaction.entity';

export const balanceRepository = typeOrmDataSource.getRepository(BalanceEntity);
export const paymentTransactionRepository = typeOrmDataSource.getRepository(
    PaymentTransactionEntity,
);
