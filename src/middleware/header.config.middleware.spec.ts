import { INestApplication } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { HeaderConfigMiddleware } from "./header.config.middleware";
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as request from 'supertest';
import { SocialSpacesModule } from "../social-spaces/social-spaces.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SocialSpace } from "../social-spaces/entities/social-space.entity";

describe("capture header content-type", () => {
    let app: INestApplication;
    let configService: ConfigService;
    const TEST_PORT = 3000;

    beforeAll(async () => {

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: './.env.test',
                    load: [() => ({ PORT: TEST_PORT })],
                }),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [SocialSpace],
                    synchronize: true, // Isso vai criar as tabelas automaticamente
                    logging: true // Habilita logs do TypeORM para debug
                }),
                SocialSpacesModule
            ],
            providers: [
                HeaderConfigMiddleware
            ]
        }).compile();

        const server = express();
        configService = module.get(ConfigService);
        app = module.createNestApplication(new ExpressAdapter(server));

        app.use(express.json());
        const middleware = new HeaderConfigMiddleware();
        app.use(middleware.use.bind(middleware));

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should reject non-GET, HEAD, OPTIONS requests without application/json Content-Type', async () => {
        // Arrange
        const name: string = configService.get<string>('PAYLOAD_NAME');
        const owner: string = configService.get<string>('PAYLOAD_OWNER');
        const testData = { 
            name: name, 
            owner: owner
        };
        const url = configService.get<string>('URL_POST_SPACES');

        // Act
        const result = await request(app.getHttpServer())
            .post(url)
            .set('Content-Type', 'text/plain')
            .send(JSON.stringify(testData));

        // Assert
        expect(result.status).toBe(415);
        expect(result.body).toEqual({
            statusCode: 415,
            message: 'Unsupported Media Type. Only application/json is allowed.',
            timestamp: expect.any(String),
            path: '/spaces/safe/simple'
        });
    });

    it('should accept non-GET requests with Content-Type application/json', async () => {
        // Arrange
        const name: string = configService.get<string>('PAYLOAD_NAME');
        const owner: string = configService.get<string>('PAYLOAD_OWNER');
        const testData = { 
            name: name, 
            owner: owner
        };

        // Act
        const result = await request(app.getHttpServer())
            .post('/spaces/safe/simple')
            .set('Content-Type', 'application/json')
            .send(testData);

        // Assert
        expect(result.status).toBe(201);
        expect(result.body).toMatchObject({
            uri: expect.stringMatching(/^http:\/\/localhost:3000\/spaces\/\d+$/),
        });
    });

    it('should set Content-Type to application/json if not set', async () => {
        // Act
        const result = await request(app.getHttpServer())
            .get('/spaces');

        // Assert
        expect(result.status).toBe(200);
        expect(result.headers['content-type']).toContain('application/json');
    });

    it('should accept HEAD requests without Content-Type header', async () => {
        // Act
        const result = await request(app.getHttpServer())
            .head('/spaces')
            .expect(200);

        // Assert
        expect(result.headers['content-type']).toContain('application/json');
    });

    it('should reject requests with incorrect Content-Type', async () => {
        // Act
        const result = await request(app.getHttpServer())
            .post('/spaces/safe/simple')
            .set('Content-Type', 'application/xml')
            .send('<test>data</test>');

        // Assert
        expect(result.status).toBe(415);
        expect(result.body.message).toBe('Unsupported Media Type. Only application/json is allowed.');
    });

    it('should accept request with charset in Content-Type', async () => {
        // Arrange
        const name: string = configService.get<string>('PAYLOAD_NAME');
        const owner: string = configService.get<string>('PAYLOAD_OWNER');
        const testData = { 
            name: name, 
            owner: owner
        };

        // Act
        const result = await request(app.getHttpServer())
            .post('/spaces/safe/simple')
            .set('Content-Type', 'application/json; charset=utf-8')
            .send(testData);

        // Assert
        expect(result.status).toBe(201);
    });
});