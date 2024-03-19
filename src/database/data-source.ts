import config from '../common/config';
import { DataSource } from 'typeorm';
import { BalanceEntity } from './entities/balance.entity';
import { PaymentTransactionEntity } from './entities/paymentTransaction.entity';
import { IncomingRequestEntity } from './entities/incomingRequest.entity';
import { LogEntity } from './entities/log.entity';
import { OrderEntity } from './entities/order.entity';

export const typeOrmDataSource = new DataSource({
    type: 'postgres',
    host: config.db.postgres.host,
    port: config.db.postgres.port,
    username: config.db.postgres.user,
    password: config.db.postgres.password,
    database: config.db.postgres.name,
    logging: true,
    synchronize: false,
    name: 'default',
    entities: [
        BalanceEntity,
        PaymentTransactionEntity,
        IncomingRequestEntity,
        LogEntity,
        OrderEntity,
    ],
    migrations: [],
});
