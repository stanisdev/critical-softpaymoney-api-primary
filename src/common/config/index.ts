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
    server: {
        port: +env.ENTRY_POINT_SERVER_PORT,
    },
    db: {
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        name: env.POSTGRES_DATABASE,
        host: env.POSTGRES_HOST,
        port: +env.POSTGRES_PORT,
        poolMaxSize: +env.POSTGRES_POOL_MAX_SIZE,
    },
    environment: {
        isDev() {
            return (
                typeof nodeEnv === 'string' && nodeEnv.includes('development')
            );
        },
    },
};
