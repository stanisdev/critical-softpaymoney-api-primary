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
    Response,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { PaymentSystemValidationPipe } from 'src/common/pipes/payment-system-validation.pipe';
import { HandlerDestinationValidationPipe } from 'src/common/pipes/handler-destination-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary } from 'src/common/types/general';
import { HandlerDestination, PaymentSystem } from 'src/common/enums/general';
import { PrimaryProcessingResultHandler } from './primary.processing-result-handler';

@UsePipes(PaymentSystemValidationPipe, HandlerDestinationValidationPipe)
@Controller('/primary/:paymentSystem/:handlerDestination')
@Controller('/')
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
        @Param('handlerDestination') handlerDestination: HandlerDestination,
        @Response() reply: FastifyReply,
    ): Promise<void> {
        const processingResult = await this.primaryService.processRequest(
            query,
            paymentSystem,
            handlerDestination,
        );
        const processingResultHandler = new PrimaryProcessingResultHandler();
        processingResultHandler.setReply(reply);
        processingResultHandler.setProcessingResult(processingResult);
        processingResultHandler.handle();
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
        const processingResultHandler = new PrimaryProcessingResultHandler();
        processingResultHandler.setReply(reply);
        processingResultHandler.setProcessingResult(processingResult);
        processingResultHandler.handle();
    }
}
