import * as xml from 'xml';
import { FastifyReply } from 'fastify';
import {
    Dictionary,
    PrimaryProcessingRequestResult,
} from 'src/common/types/general';
import { ContentType, IncomingRequestStatus } from 'src/common/enums/general';
import { InternalServerErrorException } from '@nestjs/common';

export class PrimaryProcessingResultHandler {
    private reply: FastifyReply;
    private processingResult: PrimaryProcessingRequestResult;

    /**
     * Set reply
     */
    setReply(reply: FastifyReply): void {
        this.reply = reply;
    }

    /**
     * Set processing result
     */
    setProcessingResult(
        processingResult: PrimaryProcessingRequestResult,
    ): void {
        this.processingResult = processingResult;
    }

    /**
     * Start handling process
     */
    handle(): void {
        const { processingResult, reply } = this;

        if (
            processingResult.incomingRequestStatus ===
            IncomingRequestStatus.Processed
        ) {
            const replyParams = this.compileReplyParams(
                processingResult.requestResultData,
            );
            reply.header('Content-Type', replyParams.contentType);
            reply.send(replyParams.payload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }

    /**
     * Compile reply parameters (Content type & Payload)
     */
    compileReplyParams(requestResultData: Dictionary) {
        /**
         * @todo: define a type for the variable below
         * and for the method
         */
        let payload;

        if (requestResultData.contentType === ContentType.Xml) {
            payload = xml(<string>requestResultData.payload, true);
        } else {
            payload = requestResultData.payload;
        }
        return {
            contentType: requestResultData.contentType,
            payload,
        };
    }
}
