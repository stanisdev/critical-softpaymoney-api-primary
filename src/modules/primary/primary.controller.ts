import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UsePipes,
    InternalServerErrorException,
    Response,
} from '@nestjs/common';
import * as xml from 'xml';
import { PaymentSystemValidationPipe } from 'src/common/pipes/payment-system-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary, SuccessfulResponse } from 'src/common/types/general';
import {
    ContentType,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';
import { FastifyReply } from 'fastify';
import { GeneralUtil } from 'src/common/utils/general.util';

@UsePipes(PaymentSystemValidationPipe)
@Controller('/primary/:paymentSystem')
export class PrimaryController {
    constructor(private readonly primaryService: PrimaryService) {}

    /**
     * Entry point for GET method
     */
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async indexGet(
        @Query() query: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        const processingResult = await this.primaryService.processRequest(
            JSON.stringify(query),
            paymentSystem,
        );

        if (processingResult === IncomingRequestStatus.Processed) {
            const responseParams =
                GeneralUtil.getPaymentSystemResponse(paymentSystem);

            reply.header('Content-Type', responseParams.contentType);
            let responsePayload;

            if (responseParams.contentType === ContentType.Xml) {
                responsePayload = xml(responseParams.payload, true);
            } else {
                responsePayload = responseParams.payload;
            }
            reply.send(responsePayload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }

    /**
     * Entry point for POST method
     *
     * @todo: edit this method
     */
    @Post('/')
    @HttpCode(HttpStatus.OK)
    async indexPost(
        @Body() body: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
    ): Promise<SuccessfulResponse> {
        const processingResult = await this.primaryService.processRequest(
            JSON.stringify(body),
            paymentSystem,
        );
        if (processingResult === IncomingRequestStatus.Processed) {
            return {
                ok: true,
            };
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }
}
