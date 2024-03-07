import { Controller, Get, Post } from '@nestjs/common';

@Controller('/')
export class PrimaryController {
    @Get('/')
    indexGet() {
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
