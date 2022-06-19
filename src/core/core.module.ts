import { Module } from '@nestjs/common';
import { MessageModule } from 'src/message/message.module';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { DebuggerModule } from 'src/debugger/debugger.module';
import Configs from 'src/config/index';
import { AuthModule } from 'src/auth/auth.module';
import { PaginationModule } from 'src/utils/pagination/pagination.module';
import { HelperModule } from 'src/utils/helper/helper.module';
import { MiddlewareModule } from 'src/utils/middleware/middleware.module';
import { DebuggerOptionService } from 'src/debugger/service/debugger.option.service';
import { DatabaseModule } from 'src/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/database/database.constant';
import { DatabaseService } from 'src/database/service/database.service';
import { LoggerModule } from 'src/logger/logger.module';
import { RequestModule } from 'src/utils/request/request.module';
import { ErrorModule } from 'src/utils/error/error.module';
import { SettingModule } from 'src/setting/setting.module';
import { VersionModule } from 'src/utils/version/version.module';
import { CacheModule } from 'src/cache/cache.module';
import { ResponseModule } from 'src/utils/response/response.module';

@Module({
    controllers: [],
    providers: [],
    imports: [
        ConfigModule.forRoot({
            load: Configs,
            ignoreEnvFile: false,
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
        }),
        WinstonModule.forRootAsync({
            inject: [DebuggerOptionService],
            imports: [DebuggerModule],
            useFactory: (loggerService: DebuggerOptionService) =>
                loggerService.createLogger(),
        }),
        MongooseModule.forRootAsync({
            connectionName: DATABASE_CONNECTION_NAME,
            inject: [DatabaseService],
            imports: [DatabaseModule],
            useFactory: (databaseService: DatabaseService) =>
                databaseService.createMongooseOptions(),
        }),
        HelperModule,
        CacheModule,
        DebuggerModule,
        MessageModule,
        ErrorModule,
        ResponseModule,
        PaginationModule,
        SettingModule,
        RequestModule,
        VersionModule,
        MiddlewareModule,
        LoggerModule,
        AuthModule,
    ],
})
export class CoreModule {}
