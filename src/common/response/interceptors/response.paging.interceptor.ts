import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import {
    IResponsePaging,
    IResponsePagingHttp,
    IResponsePagingMetadataHttp,
} from '../response.interface';
import { Response } from 'express';
import { IRequestApp } from 'src/common/request/request.interface';
import { IMessage } from 'src/common/message/message.interface';
import { MessageService } from 'src/common/message/services/message.service';
import { ENUM_PAGINATION_TYPE } from 'src/common/pagination/constants/pagination.constant';
import {
    RESPONSE_MESSAGE_PATH_META_KEY,
    RESPONSE_PAGING_TYPE_META_KEY,
    RESPONSE_SERIALIZATION_META_KEY,
} from '../constants/response.constant';
import { Reflector } from '@nestjs/core';
import {
    ClassConstructor,
    ClassTransformOptions,
    plainToInstance,
} from 'class-transformer';

@Injectable()
export class ResponsePagingInterceptor
    implements NestInterceptor<Promise<any>>
{
    constructor(
        private readonly reflector: Reflector,
        private readonly messageService: MessageService
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<Promise<any> | string>> {
        if (context.getType() === 'http') {
            return next.handle().pipe(
                map(async (responseData: Promise<Record<string, any>>) => {
                    const ctx: HttpArgumentsHost = context.switchToHttp();
                    const responseExpress: Response = ctx.getResponse();
                    const requestExpress: IRequestApp =
                        ctx.getRequest<IRequestApp>();

                    let messagePath: string = this.reflector.get<string>(
                        RESPONSE_MESSAGE_PATH_META_KEY,
                        context.getHandler()
                    );
                    const type: ENUM_PAGINATION_TYPE =
                        this.reflector.get<ENUM_PAGINATION_TYPE>(
                            RESPONSE_PAGING_TYPE_META_KEY,
                            context.getHandler()
                        );
                    const classSerialization: ClassConstructor<any> =
                        this.reflector.get<ClassConstructor<any>>(
                            RESPONSE_SERIALIZATION_META_KEY,
                            context.getHandler()
                        );
                    const classSerializationOptions: ClassTransformOptions =
                        this.reflector.get<ClassTransformOptions>(
                            'class_serializer:options',
                            context.getHandler()
                        );

                    // message base on language
                    const { customLang } = ctx.getRequest<IRequestApp>();

                    // response
                    const response = (await responseData) as IResponsePaging;
                    const {
                        metadata,
                        totalData,
                        currentPage,
                        perPage,
                        data,
                        availableSort,
                        availableSearch,
                        totalPage,
                    } = response;
                    let statusCode: number = responseExpress.statusCode;
                    const serialization = plainToInstance(
                        classSerialization,
                        data,
                        classSerializationOptions
                    );

                    if (metadata) {
                        statusCode = metadata.statusCode || statusCode;
                        messagePath = metadata.message || messagePath;

                        delete metadata.statusCode;
                        delete metadata.message;
                    }

                    // metadata
                    const path = requestExpress.path;
                    const addMetadata: IResponsePagingMetadataHttp = {
                        nextPage:
                            currentPage < totalPage
                                ? `${path}?perPage=${perPage}&page=${
                                      currentPage + 1
                                  }`
                                : undefined,
                        previousPage:
                            currentPage > 1
                                ? `${path}?perPage=${perPage}&page=${
                                      currentPage - 1
                                  }`
                                : undefined,
                        firstPage: `${path}?perPage=${perPage}&page=${totalPage}`,
                        lastPage: `${path}?perPage=${perPage}&page=${1}`,
                    };

                    // message
                    const message: string | IMessage =
                        await this.messageService.get(messagePath, {
                            customLanguages: customLang,
                        });

                    const responseHttp: IResponsePagingHttp = {
                        statusCode,
                        message,
                        totalData,
                        totalPage,
                        currentPage,
                        perPage,
                        availableSort,
                        availableSearch,
                        metadata: {
                            ...addMetadata,
                            ...metadata,
                        },
                        data: serialization,
                    };

                    if (
                        type === ENUM_PAGINATION_TYPE.SIMPLE ||
                        type === ENUM_PAGINATION_TYPE.MINI
                    ) {
                        delete responseHttp.totalPage;
                        delete responseHttp.currentPage;
                        delete responseHttp.perPage;
                    }

                    if (type === ENUM_PAGINATION_TYPE.MINI) {
                        delete responseHttp.availableSort;
                        delete responseHttp.availableSearch;
                    }

                    return responseHttp;
                })
            );
        }

        return next.handle();
    }
}
