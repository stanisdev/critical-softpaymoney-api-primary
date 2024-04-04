import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpClient } from 'src/common/providers/httpClient';
import { Dictionary } from 'src/common/types/general';
import DatabaseLogger from 'src/common/providers/logger/database.logger';
import config from 'src/common/config';
import HTTPMethod from 'http-method-enum';
import { DatabaseLogType } from 'src/common/enums/general';

@Injectable()
export class HandlerHelper {
    private static databaseLogger = DatabaseLogger.getInstance();

    /**
     * Send data to external interaction server
     */
    async sendDataToExternalInteractionServer(
        dataToSend: Dictionary,
    ): Promise<void> {
        const port = config.server.port.externalInteraction;
        const url = `http://localhost:${port}/external-interaction`;

        const httpClient = new HttpClient({
            url,
            body: dataToSend,
            method: HTTPMethod.POST,
            timeout: config.timeout.externalInteraction,
        });
        const requestResult = await httpClient.sendRequest();

        if (
            requestResult.ok !== true &&
            requestResult.statusCode !== HttpStatus.OK
        ) {
            await HandlerHelper.databaseLogger.write(
                DatabaseLogType.ExternalInteractionRequestFailed,
                {
                    url,
                    body: dataToSend,
                    requestResult,
                },
            );
        }
    }
}
