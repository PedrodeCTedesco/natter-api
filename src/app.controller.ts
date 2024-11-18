import { Controller, Get, Options } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Options()
  getHello(): string {
    return this.appService.getHello();
  }

  @Options()
  handleOptions() {
    return { status: 'options ok' };
  }
}
