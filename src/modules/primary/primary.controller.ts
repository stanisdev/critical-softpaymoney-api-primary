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
    Request,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
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
        {
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
        console.log('PRAPARATION ========', query);

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
    }

    /**
     * Query params example:
        {
            trx_id: '2V06OFTELPVTZR7R',
            merch_id: 'A471B6C085183B83C051',
            result_code: '1',
            amount: '10000',
            account_id: '235287251F325636B85E',
            'o.CustomerKey': 'IgT92MEfiH9k6Xcy3qLck0z5MK0DjQ3L',
            'o.PaymentStatus': 'new',
            'o.TestEnv': 'true',
            'p.rrn': '17133418337 ',
            'p.authcode': '933921',
            'p.srcType': 'CARD',
            'p.maskedPan': '411111xxxxxx1111',
            'p.isFullyAuthenticated': 'Y',
            'p.transmissionDateTime': '0417111713',
            'p.paymentSystem': 'VISA',
            ts: '20240417 11:17:14',
            signature: 'jum1woJImlx6+8SKz9+JLoQPuasrP2XUZd9z73wg+4SjAJ7lE83fHCvRH0/e7FrwHJOp7Qog1/9k81FquC56JbR4+RVBiev9mY2y+6yNEXBOUw82EeI1FImkCca2GhPPdSZqaJkksmOwfZXxd1q/AaxiYUr7TKd/Mh0X1/c7xUgafi3E1Lm5mAhQFuOsYb7n/yZGSnQDDzZnlv+PT7rXVpuaZVRX4BR628Vn8IyjU4AdqQjQsNWv/9i2a7QvnVc30gILSvUq03HoVADFajOA054vU1WB6uTKi8gzwzGUvwZ1aUre72/lh1GyvEM1fZB9HW6ogWY7Ux3MS/oovBCuXg=='
        }

        URL exmaple: 
        http://api.softpaymoney.com/api/payment/gazprom?trx_id=2X2SC4N9SHWWWR0O&merch_id=A471B6C085183B83C051&result_code=1&amount=10000&account_id=235287251F325636B85E&o.CustomerKey=IgT92MEfiH9k6Xcy3qLck0z5MK0DjQ3L&o.PaymentStatus=new&o.TestEnv=true&p.rrn=17133445198+&p.authcode=933921&p.srcType=CARD&p.maskedPan=411111xxxxxx1111&p.isFullyAuthenticated=Y&p.transmissionDateTime=0417120159&p.paymentSystem=VISA&ts=20240417+12%3A02%3A00&signature=pOYumTcEo3VLMuFJENiQ%2BDqpjZdoDjVHt9B6QJVPJZ9P40ixUXVl4afw%2Fzv7V5nJ3ks1sH%2BHO8oMBwI%2FoelOWIIM990SeyqIaduwCDOswo5508YI23wfp0inXckw32%2F15zi35NVUkYK7NTBBtcdrB92jv73hPa3BfKd%2Bs1c77mPSVHYUStYJZdjPJ2BBXbOHSuzQNCcYRxgpAQTTt7epRWTYNmtlduc59y0MKqdozI1fi87f%2B0gE6L0%2B1L5M9xnJBEYDsUk7KttjJ3pAbcQkManG6qeJ1nmO%2FJguWNEzYUAe51IOYD3zQgUo2zbJ1B%2FoacaTqPxHtGHlKKhnWlguVQ%3D%3D
     */
    @Get('/api/payment/gazprom')
    @HttpCode(HttpStatus.OK)
    async complete(
        @Query() query: Dictionary,
        @Response() reply: FastifyReply,
        @Request() request: FastifyRequest,
    ): Promise<void> {
        const paymentSystem = PaymentSystem.Gazprom;
        const handlerDestination = HandlerDestination.Completion;
        const fullUrl = `https://api.softpaymoney.com${request.originalUrl}`;

        const processingResult = await this.primaryService.processRequest(
            query,
            paymentSystem,
            handlerDestination,
            { fullUrl },
        );

        reply.header('Content-Type', 'application/json');
        reply.send({ one: 1 });
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
