import { typeOrmDataSource } from '../data-source';
import { BalanceEntity } from '../entities/balance.entity';
import { IncomingRequestEntity } from '../entities/incomingRequest.entity';
import { PaymentTransactionEntity } from '../entities/paymentTransaction.entity';

export const balanceRepository = typeOrmDataSource.getRepository(BalanceEntity);
export const paymentTransactionRepository = typeOrmDataSource.getRepository(
    PaymentTransactionEntity,
);
export const incomingRequestRepository = typeOrmDataSource.getRepository(
    IncomingRequestEntity,
);
