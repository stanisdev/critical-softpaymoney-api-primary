import { DataSource } from 'typeorm';
import { BalanceEntity } from './entities/balance.entity';
import config from '../common/config';
import { PaymentTransactionEntity } from './entities/paymentTransaction.entity';
import { IncomingRequestEntity } from './entities/incomingRequest.entity';
import { LogEntity } from './entities/log.entity';

export const typeOrmDataSource = new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    logging: true,
    synchronize: false,
    name: 'default',
    entities: [
        BalanceEntity,
        PaymentTransactionEntity,
        IncomingRequestEntity,
        LogEntity,
    ],
    migrations: [],
});
