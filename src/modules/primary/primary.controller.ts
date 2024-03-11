import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UsePipes,
} from '@nestjs/common';
import { PaymentSystemValidationPipe } from 'src/common/pipes/payment-system-validation.pipe';
import { PrimaryService } from './primary.service';
import { Dictionary, SuccessfulResponse } from 'src/common/types/general';
import { PaymentSystem } from 'src/common/enums/general';

@Controller('/')
@UsePipes(PaymentSystemValidationPipe)
export class PrimaryController {
    constructor(private readonly primaryService: PrimaryService) {}

    /**
     * Entry point for GET method
     */
    @Get('/entry-point/:paymentSystem')
    async indexGet(
        @Query() query: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
    ): Promise<SuccessfulResponse> {
        await this.primaryService.basicHandler(
            JSON.stringify(query),
            paymentSystem,
        );
        return {
            ok: true,
        };
    }

    /**
     * Entry point for POST method
     */
    @Post('/entry-point/:paymentSystem')
    async indexPost(
        @Body() body: Dictionary,
        @Param('paymentSystem') paymentSystem: PaymentSystem,
    ): Promise<SuccessfulResponse> {
        await this.primaryService.basicHandler(
            JSON.stringify(body),
            paymentSystem,
        );
        return {
            ok: true,
        };
    }
}
