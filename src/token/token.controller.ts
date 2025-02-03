import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from './token.service';

@Controller('sessions') 
export class TokenController {
    constructor(private readonly tokenService: TokenService) {}

    @Post()
    async login(@Req() request: Request, @Res() response: Response): Promise<any> {
        return this.tokenService.login(request, response);
    }
}