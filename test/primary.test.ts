import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from 'src/modules/app.module';
import { TransformResponseInterceptor } from 'src/common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception.filter';
import { typeOrmDataSource } from 'src/database/data-source';
import { PostgresQueries } from 'src/database/queries/postgres.queries';
import { incomingRequestRepository } from 'src/database/repositories';
import { HandlerDestination, PaymentSystem } from 'src/common/enums/general';

describe('Auth controller', () => {
    let app: NestFastifyApplication;

    const queryPayload = {
        merch_id: '11E736BEE0199227B039',
        back_url_s:
            'https://org.softpaymoney.com/order/details/a1e272bf-ebcd-46eb-9037-4f66a3c61dc5',
        back_url_f: 'https://org.softpaymoney.com/',
        'o.CustomerKey': 'Hp242MXuiH5vAXFy3qGckiz5MK0DjQ3t',
        'o.PaymentStatus': 'new',
        amount: 100000,
    };

    beforeAll(async () => {
        await typeOrmDataSource.initialize();
        await PostgresQueries.cleanOutDatabase();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        app.enableShutdownHooks();
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalInterceptors(new TransformResponseInterceptor());
        app.useGlobalPipes(new ValidationPipe());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    describe('POST: /primary/GAZPROM/PREPARATION', () => {
        test('It should save incoming request with a proper payment system', async () => {
            const orderPaymentId = faker.string.nanoid(32);
            queryPayload['o.CustomerKey'] = orderPaymentId;

            await request(app.getHttpServer())
                .get('/primary/GAZPROM/PREPARATION')
                .query(queryPayload);

            const foundResult = await incomingRequestRepository
                .createQueryBuilder('ir')
                .select(['ir.paymentSystem'])
                .where(`ir.payload @> '{"o.CustomerKey":"${orderPaymentId}"}'`)
                .getOne();

            expect(foundResult.paymentSystem).toBe(PaymentSystem.Gazprom);
        });

        test('It should create only 1 record in the "IncomingRequest" table', async () => {
            await incomingRequestRepository
                .createQueryBuilder()
                .delete()
                .execute();

            const orderPaymentId = faker.string.nanoid(32);
            queryPayload['o.CustomerKey'] = orderPaymentId;

            await request(app.getHttpServer())
                .get('/primary/GAZPROM/PREPARATION')
                .query(queryPayload);

            const totalCount = await incomingRequestRepository
                .createQueryBuilder()
                .getCount();
            expect(totalCount).toBe(1);
        });

        test('It should save incoming request with proper "handler destination"', async () => {
            const orderPaymentId = faker.string.nanoid(32);
            queryPayload['o.CustomerKey'] = orderPaymentId;

            await request(app.getHttpServer())
                .get('/primary/GAZPROM/PREPARATION')
                .query(queryPayload);

            const foundResult = await incomingRequestRepository
                .createQueryBuilder('ir')
                .select(['ir.handlerDestination'])
                .where(`ir.payload @> '{"o.CustomerKey":"${orderPaymentId}"}'`)
                .getOne();

            expect(foundResult.handlerDestination).toBe(
                HandlerDestination.Preparation,
            );
        });

        test('It should save incoming request payload correctly', async () => {
            // @todo: compare 'queryPayload' with 'IncomingRequest.payload'
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
