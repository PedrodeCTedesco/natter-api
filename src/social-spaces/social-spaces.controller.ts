import { Controller, Get, Post, Body, Param, Res, Query, Put, ParseIntPipe } from '@nestjs/common';
import { SocialSpacesService } from './social-spaces.service';
import { CreateSocialSpaceDto } from './dto/create-social-space.dto';
import { Response } from 'express';
import { SocialSpace } from './entities/social-space.entity';
import { Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('spaces')
@Throttle({ short: { limit: 3, ttl: 1000 } })
export class SocialSpacesController {
  private readonly logger = new Logger(SocialSpacesController.name);
  constructor(private readonly socialSpacesService: SocialSpacesService) {}

  @Get()
  async spaces(): Promise<SocialSpace[]> {
    return this.socialSpacesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<SocialSpace> {
    return this.socialSpacesService.findOne(id);
  }

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

  @Post(':spaceId/members')
  async addMember(
    @Param('spaceId', ParseIntPipe) spaceId: number,
    @Body('username') username: string,
    @Body('permissions') permissions: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.socialSpacesService.addMember(spaceId, username, permissions, res);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error(`Erro ao adicionar membro: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  @Put(':id')
  async updateSpace(
    @Param('id') id: number,       
    @Body() updateData: {   
      name: string;
      owner: string;
    }
  ) {
    return await this.socialSpacesService.updateSpace(id, updateData);
  }
}
