import * as dotenv from 'dotenv';
import { join, parse } from 'node:path';
import { existsSync as doesFileExist } from 'fs';

function getRootDir(): string {
    const directoryHierarchy = parse(__dirname).dir.split('/');
    const dirNameDelimiter = nodeEnv.includes('test') ? 'src' : 'dist';
    const distIndex = directoryHierarchy.lastIndexOf(dirNameDelimiter);
    return directoryHierarchy.slice(0, distIndex).join('/');
}

function getEnvFileName(): string | never {
    const envFilePath = join(rootDir, `.env.${process.env.NODE_ENV}`);
    if (!doesFileExist(envFilePath)) {
        throw new Error(`The env file "${envFilePath}" does not exist`);
    }
    return envFilePath;
}

const { env } = process;
const nodeEnv = env.NODE_ENV;
const rootDir = getRootDir();

dotenv.config({
    path: getEnvFileName(),
});

/**
 * Config object
 */
export default {
    dirs: {
        keys: join(rootDir, 'keys'),
    },
    server: {
        port: {
            primary: +env.PRIMARY_SERVER_PORT,
            handler: +env.HANDLER_SERVER_PORT,
            externalInteraction: +env.EXTERNAL_INTERACTION_SERVER_PORT,
        },
        isPrimary() {
            return env.SERVER_TYPE === 'primary';
        },
        isHandler() {
            return env.SERVER_TYPE === 'handler';
        },
        isExternalInteraction() {
            return env.SERVER_TYPE === 'externalInteraction';
        },
    },
    db: {
        postgres: {
            user: env.POSTGRES_USER,
            password: env.POSTGRES_PASSWORD,
            name: env.POSTGRES_DATABASE,
            host: env.POSTGRES_HOST,
            port: +env.POSTGRES_PORT,
            poolMaxSize: +env.POSTGRES_POOL_MAX_SIZE,
        },
        mongo: {
            user: env.MONGO_USER,
            password: env.MONGO_PASSWORD,
            name: env.MONGO_DATABASE,
            host: env.MONGO_HOST,
            port: +env.MONGO_PORT,
        },
    },
    environment: {
        isDev(): boolean {
            return Boolean(nodeEnv?.includes('development'));
        },
        isProd(): boolean {
            return Boolean(nodeEnv?.includes('production'));
        },
    },
    timeout: {
        handler: +env.HANDLER_SERVER_RESPONSE_TIMEOUT,
        externalInteraction: +env.EXTERNAL_INTERACTION_SERVER_RESPONSE_TIMEOUT,
        merchantWebhook: +env.MERCHANT_WEBHOOK_TIMEOUT,
    },
    gazprom: {
        certificateFileName: env.GAZPROM_CERTIFICATE_FILE_NAME,
    },
    rateLimiter: {
        restrictionPeriod: +env.RATE_LIMITER_RESTRICTION_PERIOD,
        maxRequests: +env.RATE_LIMITER_MAX_REQUESTS,
    },
    atol: {
        login: env.ATOL_LOGIN,
        password: env.ATOL_PASSWORD,
        url: env.ATOL_URL,
        groupCode: env.ATOL_GROUP_CODE,
        companyEmail: env.ATOL_COMPANY_EMAIL,
        inn: env.ATOL_INN,
        paymentUrl: env.ATOL_PAYMENT_URL,
    },
};
