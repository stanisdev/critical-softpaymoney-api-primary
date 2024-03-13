import * as detectPort from 'detect-port';

export class GeneralUtil {
    static async isPortInUse(portToCheck: number): Promise<boolean> {
        const availablePort = await detectPort(portToCheck);
        return availablePort !== portToCheck;
    }
}
