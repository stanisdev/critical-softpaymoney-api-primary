import crypto from 'node:crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { IncomingRequestEntity } from 'src/database/entities/incomingRequest.entity';
import { Dictionary } from 'src/common/types/general';

export class GazpromHelper {
    constructor(private readonly incomingRequest: IncomingRequestEntity) {}

    getUserPercents(user: Dictionary): number {
        if (
            user.percents instanceof Object &&
            typeof user.percents.GAZPROM === 'number'
        ) {
            return +user.percents.GAZPROM;
        }
        return 8;
    }

    parseIncomingRequest(): Dictionary {
        const { incomingRequest } = this;
        let payload: Dictionary;

        try {
            payload = JSON.parse(incomingRequest.payload);
        } catch {
            throw new InternalServerErrorException(
                `Payload of incoming request with id=${incomingRequest.id} cannot be parsed`,
            );
        }
        return payload;
    }

    isSignatureCorrect(
        signature: string,
        url: string,
        certificateContent: string,
    ): boolean {
        const decodedSignature = decodeURIComponent(signature);

        const publicKey = crypto
            .createPublicKey({ key: certificateContent })
            .export({ type: 'spki', format: 'pem' });

        return crypto
            .createVerify('RSA-SHA1')
            .update(url)
            .verify(publicKey, decodedSignature, 'base64');
    }
}
