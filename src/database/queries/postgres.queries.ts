import { incomingRequestRepository } from '../repositories';

export class PostgresQueries {
    static async cleanOutDatabase(): Promise<void> {
        await incomingRequestRepository.createQueryBuilder().delete().execute();
    }
}
