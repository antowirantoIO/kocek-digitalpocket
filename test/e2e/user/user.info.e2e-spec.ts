import { HttpStatus, INestApplication } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { useContainer } from 'class-validator';
import { CommonModule } from 'src/common/common.module';
import { AuthService } from 'src/common/auth/services/auth.service';
import { RoutesModule } from 'src/router/routes/routes.module';
import {
    E2E_USER_INFO,
    E2E_USER_PAYLOAD_TEST,
} from 'test/e2e/user/user.constant';

describe('E2E User', () => {
    let app: INestApplication;
    let authService: AuthService;

    const apiKey = 'qwertyuiop12345zxcvbnmkjh';
    const apiKeyHashed =
        'e11a023bc0ccf713cb50de9baa5140e59d3d4c52ec8952d9ca60326e040eda54';
    const xApiKey = `${apiKey}:${apiKeyHashed}`;

    let accessToken: string;

    beforeAll(async () => {
        process.env.AUTH_JWT_PAYLOAD_ENCRYPTION = 'false';

        const modRef = await Test.createTestingModule({
            imports: [
                CommonModule,
                RoutesModule,
                RouterModule.register([
                    {
                        path: '/',
                        module: RoutesModule,
                    },
                ]),
            ],
        }).compile();

        app = modRef.createNestApplication();
        useContainer(app.select(CommonModule), { fallbackOnErrors: true });
        authService = app.get(AuthService);

        const payload = await authService.createPayloadAccessToken(
            E2E_USER_PAYLOAD_TEST,
            false
        );
        accessToken = await authService.createAccessToken(payload);

        await app.init();
    });

    it(`GET ${E2E_USER_INFO} Success`, async () => {
        const response = await request(app.getHttpServer())
            .get(E2E_USER_INFO)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('x-api-key', xApiKey);

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.statusCode).toEqual(HttpStatus.OK);
    });
});
