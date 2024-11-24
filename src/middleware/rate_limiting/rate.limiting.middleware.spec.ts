import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SocialSpace } from "../social-spaces/entities/social-space.entity";
import { SocialSpacesModule } from "../social-spaces/social-spaces.module";
import { ThrottleLoggerMiddleware } from "./rate.limiting.middleware";
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

describe("rate limiting middleware", () => {
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
                    synchronize: true, 
                    logging: true
                }),
                SocialSpacesModule
            ],
            providers: [
                ThrottleLoggerMiddleware
            ]
        }).compile();

        const server = express();
        configService = module.get(ConfigService);
        app = module.createNestApplication(new ExpressAdapter(server));

        app.use(express.json());
        const middleware = new ThrottleLoggerMiddleware();
        app.use(middleware.use.bind(middleware));

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it("should log incoming requests", async () => {
        // Arrange
        const mockLogger = { debug: jest.fn(), log: jest.fn(), warn: jest.fn() };
        const request = {
            ip: configService.get<string>('IP'),
            path: configService.get<string>('PATH')
        } as any;

        const response = {
            on: jest.fn(),
            statusCode: 200
        } as any;

        const next = jest.fn();
        const middleware = new ThrottleLoggerMiddleware();
        (middleware as any).logger = mockLogger;

        // Act
        middleware.use(request, response, next);

        // Assert
        expect(mockLogger.debug).toHaveBeenCalledWith(
            'Request count for IP 127.0.0.1: 2 in last second'
        );

        expect(mockLogger.log).toHaveBeenCalledWith(
            'Request count for IP 127.0.0.1: 1 in last second'
        );
    });
});