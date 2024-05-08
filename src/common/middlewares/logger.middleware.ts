import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { OpenSearchClient } from '../providers/open-search-client';
import { Dictionary } from '../types/general';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    async use(req: FastifyRequest, _: FastifyReply, next: Function) {
        const data: Dictionary = {
            method: req.method,
            url: req.originalUrl,
        };
        await OpenSearchClient.insertDocument(data);
        next();
    }
}
