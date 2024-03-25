import * as detectPort from 'detect-port';
import { createHash } from 'node:crypto';
import { ContentType, PaymentSystem } from '../enums/general';
import { GazpromWebhook } from '../providers/webhook/gazprom/gazprom.webhook';

export class GeneralUtil {
    static async isPortInUse(portToCheck: number): Promise<boolean> {
        const availablePort = await detectPort(portToCheck);
        return availablePort !== portToCheck;
    }

    static getPaymentSystemResponse(paymentSystem: PaymentSystem) {
        if (paymentSystem === PaymentSystem.Gazprom) {
            return GazpromWebhook.successfulResponse;
        } else {
            return {
                payload: {
                    ok: true,
                },
                contentType: ContentType.Json,
            };
        }
    }

    static generateSha256Hash(content: string): string {
        return createHash('sha256').update(content).digest('hex');
    }
}
