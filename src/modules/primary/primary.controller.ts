import { Controller, Get, Post } from '@nestjs/common';
import { PrimaryService } from './primary.service';

@Controller('/')
export class PrimaryController {
    constructor(private readonly primaryService: PrimaryService) {}

    @Get('/')
    async indexGet() {
        await this.primaryService.basicHandler();
        return {
            ok: true,
        };
    }

    @Post('/')
    indexPost() {
        return {
            ok: true,
        };
    }
}
