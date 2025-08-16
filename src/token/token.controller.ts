import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from './token.service';

@Controller('sessions') 
export class TokenController {
    constructor(private readonly tokenService: TokenService) {}

    @Post()
    async login(@Req() request: Request): Promise<any> {
        return this.tokenService.login(request);
    }
}