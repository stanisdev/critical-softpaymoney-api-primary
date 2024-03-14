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
} from '@nestjs/common';
import { PaymentSystemValidationPipe } from 'src/common/pipes/payment-system-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary, SuccessfulResponse } from 'src/common/types/general';
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
    ): Promise<SuccessfulResponse> {
        const processingResult = await this.primaryService.processRequest(
            JSON.stringify(query),
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

    /**
     * Entry point for POST method
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
