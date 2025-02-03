import { INestApplication } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { HeaderAuthMiddleware } from "./header.auth.middleware";
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as request from 'supertest';
import { UsersService } from "src/users/users.service";
import { UserDB } from "src/users/interfaces/user.interface";
import * as bcrypt from 'bcrypt';

describe("HeaderAuthMiddleware", () => {
    let app: INestApplication;
    let configService: ConfigService;
    let usersService: UsersService;
    const TEST_PORT = 3000;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: './.env.test',
                    load: [() => ({ PORT: TEST_PORT })],
                }),
            ],
            providers: [
                HeaderAuthMiddleware,
                {
                    provide: UsersService,
                    useValue: {
                        validateBasicAuth: jest.fn().mockImplementation(() => {
                            const user: UserDB = {
                                user_id: '1',
                                permissions: 'a',
                                pw_hash: bcrypt.hashSync('password123', 10),
                            };
                            return Promise.resolve(user);
                        }),
                    },
                },
            ],
        }).compile();

        const server = express();
        configService = module.get(ConfigService);
        usersService = module.get(UsersService);
        app = module.createNestApplication(new ExpressAdapter(server));

        app.use(express.json());
        const middleware = module.get(HeaderAuthMiddleware);
        app.use(middleware.use.bind(middleware));

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should measure the time taken to verify user credentials', async () => {
        // Arrange
        const username = 'testuser';
        const password = 'password123';
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

        // Inicia a medição do tempo
        console.time('Credential Verification Time');

        // Act
        const result = await request(app.getHttpServer())
            .post('/some-protected-endpoint')
            .set('Authorization', authHeader)
            .set('Accept', 'application/json')
            .send({});

        // Finaliza a medição do tempo
        console.timeEnd('Credential Verification Time');

        // Assert
        expect(result.status).toBe(200); // Supondo que o endpoint protegido retorne 200 após autenticação
    });
});