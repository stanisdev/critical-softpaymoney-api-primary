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
import { HandlerDestinationValidationPipe } from 'src/common/pipes/handler-destination-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary } from 'src/common/types/general';
import {
    HandlerDestination,
    IncomingRequestStatus,
    PaymentSystem,
} from 'src/common/enums/general';

// @UsePipes(PaymentSystemValidationPipe, HandlerDestinationValidationPipe)
// @Controller('/primary/:paymentSystem/:handlerDestination')
@Controller('/')
export class PrimaryController {
    constructor(private readonly primaryService: PrimaryService) {}

    /**
     * Temporary solution for testing
     * 
     * Query params example:

        QUERY, ======== Empty <[Object: null prototype] {}> {
            merch_id: 'A471B6C085183B83C051',
            trx_id: '13NBJDKKBUZF1RY1',
            'o.CustomerKey': 'IgT92MNfiH9U6Xcy3qGckiz5MK0DjQ3L',
            'o.PaymentStatus': 'new',
            'o.TestEnv': 'true',
            ts: '20240416 12:28:24'
        }

        URL example: https://api.softpaymoney.com/api/payment/gazprom/verify?merch_id=A471B6C085183B83C051&trx_id=13NBJDKKBUZF1RY1&o.CustomerKey=IgT92MNfiH9U6Xcy3qGckiz5MK0DjQ3L&o.PaymentStatus=new&o.TestEnv=true&ts=2024041612:28:24
     */
    @Get('/api/payment/gazprom/verify')
    @HttpCode(HttpStatus.OK)
    async verify(
        @Query() query: Dictionary,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        console.log('QUERY, ========', query);

        const paymentSystem = PaymentSystem.Gazprom;
        const handlerDestination = HandlerDestination.Preparation;

        const processingResult = await this.primaryService.processRequest(
            query,
            paymentSystem,
            handlerDestination,
        );
        if (
            processingResult.incomingRequestStatus ===
            IncomingRequestStatus.Processed
        ) {
            const replyParams = this.primaryService.compileReplyParams(
                processingResult.requestResultData,
            );
            reply.header('Content-Type', replyParams.contentType);
            reply.send(replyParams.payload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
        // reply.header('Content-Type', 'application/json');
        // reply.send({ one: 1 });
    }

    /**
     * Entry point for GET method
     */
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async indexGet(
        @Query() query: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
        @Param('handlerDestination') handlerDestination: HandlerDestination,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        const processingResult = await this.primaryService.processRequest(
            query,
            paymentSystem,
            handlerDestination,
        );
        if (
            processingResult.incomingRequestStatus ===
            IncomingRequestStatus.Processed
        ) {
            const replyParams = this.primaryService.compileReplyParams(
                processingResult.requestResultData,
            );
            reply.header('Content-Type', replyParams.contentType);
            reply.send(replyParams.payload);
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
        @Param('destination') handlerDestination: HandlerDestination,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        const processingResult = await this.primaryService.processRequest(
            body,
            paymentSystem,
            handlerDestination,
        );
        if (
            processingResult.incomingRequestStatus ===
            IncomingRequestStatus.Processed
        ) {
            const replyParams = this.primaryService.compileReplyParams(
                processingResult.requestResultData,
            );
            reply.header('Content-Type', replyParams.contentType);
            reply.send(replyParams.payload);
        } else {
            throw new InternalServerErrorException('Incoming request failed');
        }
    }
}
