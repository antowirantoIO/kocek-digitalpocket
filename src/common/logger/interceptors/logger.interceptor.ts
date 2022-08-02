import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ILoggerOptions } from '../logger.interface';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { IRequestApp } from 'src/common/request/request.interface';
import { LoggerService } from '../services/logger.service';
import {
    ENUM_LOGGER_ACTION,
    ENUM_LOGGER_LEVEL,
    LOGGER_ACTION_META_KEY,
    LOGGER_OPTIONS_META_KEY,
} from '../constants/logger.constant';
import { ENUM_REQUEST_METHOD } from 'src/common/request/constants/request.constant';
import { Reflector } from '@nestjs/core';

@Injectable()
export class LoggerInterceptor implements NestInterceptor<any> {
    constructor(
        private readonly reflector: Reflector,
        private readonly loggerService: LoggerService
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<Promise<any> | string>> {
        if (context.getType() === 'http') {
            const ctx: HttpArgumentsHost = context.switchToHttp();
            const { apiKey, method, originalUrl, user, id, body, params } =
                ctx.getRequest<IRequestApp>();
            const responseExpress = ctx.getResponse<Response>();
            return next.handle().pipe(
                tap(async (response: Promise<Record<string, any>>) => {
                    const responseData: Record<string, any> = await response;
                    const responseStatus: number = responseExpress.statusCode;
                    const statusCode =
                        responseData && responseData.statusCode
                            ? responseData.statusCode
                            : responseStatus;

                    const loggerAction: ENUM_LOGGER_ACTION =
                        this.reflector.get<ENUM_LOGGER_ACTION>(
                            LOGGER_ACTION_META_KEY,
                            context.getHandler()
                        );
                    const loggerOptions: ILoggerOptions =
                        this.reflector.get<ILoggerOptions>(
                            LOGGER_OPTIONS_META_KEY,
                            context.getHandler()
                        );

                    switch (loggerOptions.level) {
                        case ENUM_LOGGER_LEVEL.FATAL:
                            await this.loggerService.fatal({
                                action: loggerAction,
                                description: loggerOptions.description
                                    ? loggerOptions.description
                                    : `Request ${method} called, url ${originalUrl}, and action ${loggerAction}`,
                                apiKey: apiKey ? apiKey._id : undefined,
                                user: user ? user._id : undefined,
                                requestId: id,
                                method: method as ENUM_REQUEST_METHOD,
                                role: user ? user.role : undefined,
                                params,
                                bodies: body,
                                statusCode,
                                tags: loggerOptions.tags
                                    ? loggerOptions.tags
                                    : [],
                            });

                            break;
                        case ENUM_LOGGER_LEVEL.DEBUG:
                            await this.loggerService.debug({
                                action: loggerAction,
                                description: loggerOptions.description
                                    ? loggerOptions.description
                                    : `Request ${method} called, url ${originalUrl}, and action ${loggerAction}`,
                                apiKey: apiKey ? apiKey._id : undefined,
                                user: user ? user._id : undefined,
                                requestId: id,
                                method: method as ENUM_REQUEST_METHOD,
                                role: user ? user.role : undefined,
                                params,
                                bodies: body,
                                statusCode,
                                tags: loggerOptions.tags
                                    ? loggerOptions.tags
                                    : [],
                            });

                            break;
                        case ENUM_LOGGER_LEVEL.WARM:
                            await this.loggerService.warning({
                                action: loggerAction,
                                description: loggerOptions.description
                                    ? loggerOptions.description
                                    : `Request ${method} called, url ${originalUrl}, and action ${loggerAction}`,
                                apiKey: apiKey ? apiKey._id : undefined,
                                user: user ? user._id : undefined,
                                requestId: id,
                                method: method as ENUM_REQUEST_METHOD,
                                role: user ? user.role : undefined,
                                params,
                                bodies: body,
                                statusCode,
                                tags: loggerOptions.tags
                                    ? loggerOptions.tags
                                    : [],
                            });

                            break;
                        default:
                            await this.loggerService.info({
                                action: loggerAction,
                                description: loggerOptions.description
                                    ? loggerOptions.description
                                    : `Request ${method} called, url ${originalUrl}, and action ${loggerAction}`,
                                apiKey: apiKey ? apiKey._id : undefined,
                                user: user ? user._id : undefined,
                                requestId: id,
                                method: method as ENUM_REQUEST_METHOD,
                                role: user ? user.role : undefined,
                                params,
                                bodies: body,
                                statusCode,
                                tags: loggerOptions.tags
                                    ? loggerOptions.tags
                                    : [],
                            });

                            break;
                    }
                })
            );
        }

        return next.handle();
    }
}
