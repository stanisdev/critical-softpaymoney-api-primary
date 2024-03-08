import { DataSource } from 'typeorm';
import config from 'src/common/config';

export const typeOrmDataSource = new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
});
