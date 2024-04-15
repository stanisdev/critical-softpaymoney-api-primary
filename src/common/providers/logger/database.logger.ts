import config from 'src/common/config';
import { DatabaseLogType } from 'src/common/enums/general';
import { Dictionary } from 'src/common/types/general';
import { logRepository } from 'src/database/repositories';

export default class DatabaseLogger {
    private static instance: DatabaseLogger | null = null;
    private constructor() {}

    /**
     * Get instance of the class
     */
    static getInstance(): DatabaseLogger {
        if (!(DatabaseLogger.instance instanceof DatabaseLogger)) {
            return (DatabaseLogger.instance = new DatabaseLogger());
        }
        return DatabaseLogger.instance;
    }

    /**
     * Write log data in DB
     */
    async write(type: DatabaseLogType, payload: Dictionary): Promise<void> {
        /**
         * @todo: fix this temporary solution
         */
        if (config.environment.isTest()) {
            return;
        }
        const logRecord = {
            type,
            payload: JSON.stringify(payload),
        };
        await logRepository
            .createQueryBuilder()
            .insert()
            .values(logRecord)
            .execute();
    }
}
