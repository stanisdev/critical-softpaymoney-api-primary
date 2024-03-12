import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { getReasonPhrase as statusCodeToPhrase } from 'http-status-codes';
import { FastifyReply, FastifyRequest } from 'fastify';
import { isEmpty } from 'lodash';
import { Response } from '../interfaces/general';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    /**
     * Catch an exception
     */
    async catch(exception: HttpException, host: ArgumentsHost): Promise<void> {
        const ctx = host.switchToHttp();
        const fastifyResponse = ctx.getResponse<FastifyReply>();

        let finalResponse: Response<null>;
        let statusCode: number;

        /**
         * Nest based exception (usually 400 or 404)
         */
        if (
            exception instanceof Object &&
            typeof exception.getStatus === 'function'
        ) {
            const status = exception.getStatus();

            let errorMessage: string;

            if (
                exception instanceof Object &&
                typeof exception.getResponse === 'function'
            ) {
                const errorInstance = exception.getResponse();

                if (
                    errorInstance instanceof Object &&
                    'message' in errorInstance &&
                    typeof errorInstance.message === 'string'
                ) {
                    errorMessage = errorInstance.message;
                }
            }
            if (status === HttpStatus.NOT_FOUND) {
                errorMessage = statusCodeToPhrase(status);
            }
            if (isEmpty(errorMessage)) {
                errorMessage = 'Unknown exception';
            }

            statusCode = status;
            finalResponse = {
                statusCode,
                message: errorMessage,
            };
        } else {
            /**
             * Unknown error
             */
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            finalResponse = {
                statusCode,
                message: statusCodeToPhrase(statusCode),
            };
            /**
             * This information needs to be stored in DB logs
             */
            if (exception instanceof Error) {
                console.log(exception.message);
                console.log(exception.stack);
            }
        }

        fastifyResponse.status(statusCode).send(finalResponse);
    }
}
