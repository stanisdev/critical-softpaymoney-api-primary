import { MigrationInterface, QueryRunner } from 'typeorm';

export class Balance1709896337253 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE SEQUENCE Balances_id_seq;

            CREATE TYPE Сurrency AS ENUM ('MONEY', 'DOLLAR', 'CRYPTO');
                -- MONEY = Rub
                -- DOLLAR = Usd
                -- CRYPTO = Usdt

            CREATE TABLE "Balances" (
                id INTEGER DEFAULT nextval('Balances_id_seq') PRIMARY KEY,
                value DECIMAL NOT NULL,
                "currencyType" Сurrency NOT NULL,
                "userId" VARCHAR(24) NOT NULL,
                "verificationHash" VARCHAR(100) NOT NULL,
                "createdAt" TIMESTAMP DEFAULT current_timestamp,
                "updatedAt" TIMESTAMP,
                UNIQUE ("userId", "currencyType")
            );
        `);
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS Balances;
            DROP TYPE IF EXISTS Сurrency;
            DROP SEQUENCE IF EXISTS Balances_id_seq;
        `);
    }
}
