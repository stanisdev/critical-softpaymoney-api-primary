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
import { FastifyReply } from 'fastify';
import { PaymentSystemValidationPipe } from 'src/common/pipes/payment-system-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary } from 'src/common/types/general';
import { IncomingRequestStatus, PaymentSystem } from 'src/common/enums/general';

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
                this.primaryService.getResponseParamsByPaymentSystem(
                    paymentSystem,
                );

            reply.header('Content-Type', responseParams.contentType);
            reply.send(responseParams.payload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }

    /**
     * Entry point for POST method
     */
    @Post('/')
    @HttpCode(HttpStatus.OK)
    async indexPost(
        @Body() body: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        const processingResult = await this.primaryService.processRequest(
            JSON.stringify(body),
            paymentSystem,
        );
        if (processingResult === IncomingRequestStatus.Processed) {
            const responseParams =
                this.primaryService.getResponseParamsByPaymentSystem(
                    paymentSystem,
                );

            reply.header('Content-Type', responseParams.contentType);
            reply.send(responseParams.payload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }
}
