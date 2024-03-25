import { Injectable } from '@nestjs/common';
import { HttpClient } from 'src/common/providers/httpClient';
import { Dictionary } from 'src/common/types/general';
import config from 'src/common/config';
import HTTPMethod from 'http-method-enum';

@Injectable()
export class HandlerHelper {
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
        /**
         * @todo:
         * Process the case if request result is failed
         */
        requestResult;
    }
}
