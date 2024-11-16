import { Controller, Get, Post, Body, Param, Res, Query } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';
import { SocialSpace } from './entities/social-space.entity';
import { Logger } from '@nestjs/common';

@Controller('spaces')
export class SocialSpacesController {
  private readonly logger = new Logger(SocialSpacesController.name);
  constructor(private readonly socialSpacesService: SocialSpacesService) {}

  @Post('safe/simple')
  async createSpace(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Rota com método seguro acionada`);
    return this.socialSpacesService.create(createSocialSpaceDto, res);
  }

  @Post('unsafe')
  async createSpaceSQLInjection(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Rota com método vulnerável acionado`);
    return this.socialSpacesService.createSQLInjectionVulnerability(createSocialSpaceDto, res);
  }

  @Post('safe/complex')
  async createSafeSpace(
    @Body() createSocialSpaceDto: CreateSocialSpaceDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Rota com método vulnerável acionado`);
    return this.socialSpacesService.createSQLInjectionVulnerabilityWithSolution(createSocialSpaceDto, res);
  }

  @Get()
  async spaces(): Promise<SocialSpace[]> {
    return this.socialSpacesService.findAll();
  }

  @Post('unsafe/xss')
  async xssEndpoint(@Body() body: any, @Res() res: Response) {
    // Configurar headers para permitir o ataque (apenas para demonstração)
    res.setHeader('Content-Type', 'text/html');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'");
    
    // Simular uma validação que falha
    if (!body.owner || body.owner.length < 3) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Erro de Validação</h1>
            <p>Input inválido para o nome: ${body.name}</p>
            <script>
              console.log("Erro processado para: " + "${body.name}");
            </script>
          </body>
        </html>
      `);
    }

    // Resposta normal
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Dados recebidos:</h1>
          <p>Nome: ${body.name}</p>
          <p>Proprietário: ${body.owner}</p>
        </body>
      </html>
    `);
  }
}
