import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from 'src/auth/guard/jwt/auth.jwt.strategy';
import { DATABASE_CONNECTION_NAME } from 'src/database/database.constant';
import { DebuggerService } from 'src/debugger/service/debugger.service';
import { ApiKeyGuard } from './guard/api-key/auth.api-key.guard';
import { ApiKeyStrategy } from './guard/api-key/auth.api-key.strategy';
import { JwtRefreshStrategy } from './guard/jwt-refresh/auth.jwt-refresh.strategy';
import {
    AuthApiDatabaseName,
    AuthApiEntity,
    AuthApiSchema,
} from './schema/auth.api.schema';
import { AuthApiService } from './service/auth.api.service';
import { AuthService } from './service/auth.service';

@Module({
    providers: [
        AuthService,
        AuthApiService,
        JwtStrategy,
        JwtRefreshStrategy,
        ApiKeyStrategy,
        {
            provide: APP_GUARD,
            inject: [DebuggerService, ConfigService],
            useFactory: (
                debuggerService: DebuggerService,
                configService: ConfigService
            ) => {
                return new ApiKeyGuard(debuggerService, configService);
            },
        },
    ],
    exports: [AuthService, AuthApiService],
    controllers: [],
    imports: [
        MongooseModule.forFeature(
            [
                {
                    name: AuthApiEntity.name,
                    schema: AuthApiSchema,
                    collection: AuthApiDatabaseName,
                },
            ],
            DATABASE_CONNECTION_NAME
        ),
    ],
})
export class AuthModule {}
