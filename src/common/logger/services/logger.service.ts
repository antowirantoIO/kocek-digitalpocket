import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/services/database.service';
import { ENUM_LOGGER_LEVEL } from 'src/common/logger/constants/logger.enum.constant';
import {
    ILogger,
    ILoggerRaw,
} from 'src/common/logger/interfaces/logger.interface';
import { ILoggerService } from 'src/common/logger/interfaces/logger.service.interface';
import { LoggerRepository } from 'src/common/logger/repositories/logger.repository';
import { Logger, LoggerEntity } from 'src/common/logger/schemas/logger.schema';

@Injectable()
export class LoggerService implements ILoggerService {
    constructor(
        private readonly loggerRepository: LoggerRepository,
        private readonly databaseService: DatabaseService
    ) {}

    async info({
        action,
        description,
        apiKey,
        user,
        method,
        requestId,
        role,
        params,
        bodies,
        path,
        statusCode,
        tags,
    }: ILogger): Promise<Logger> {
        const create: LoggerEntity = {
            level: ENUM_LOGGER_LEVEL.INFO,
            user: user,
            apiKey: apiKey,
            anonymous: user ? false : true,
            action,
            description,
            method,
            requestId,
            role: role ? role._id : undefined,
            accessFor: role && role.accessFor ? role.accessFor : undefined,
            params,
            bodies,
            path,
            statusCode,
            tags,
        };

        return this.loggerRepository.create(create);
    }

    async debug({
        action,
        description,
        apiKey,
        user,
        method,
        requestId,
        role,
        params,
        bodies,
        path,
        statusCode,
        tags,
    }: ILogger): Promise<Logger> {
        const create: LoggerEntity = {
            level: ENUM_LOGGER_LEVEL.DEBUG,
            user: user,
            apiKey: apiKey,
            anonymous: user ? false : true,
            action,
            description,
            method,
            requestId,
            role: role ? role._id : undefined,
            accessFor: role ? role.accessFor : undefined,
            params,
            bodies,
            path,
            statusCode,
            tags,
        };

        return this.loggerRepository.create(create);
    }

    async warning({
        action,
        description,
        apiKey,
        user,
        method,
        requestId,
        role,
        params,
        bodies,
        path,
        statusCode,
        tags,
    }: ILogger): Promise<Logger> {
        const create: LoggerEntity = {
            level: ENUM_LOGGER_LEVEL.WARM,
            user: user,
            apiKey: apiKey,
            anonymous: user ? false : true,
            action,
            description,
            method,
            requestId,
            role: role ? role._id : undefined,
            accessFor: role && role.accessFor ? role.accessFor : undefined,
            params,
            bodies,
            path,
            statusCode,
            tags,
        };

        return this.loggerRepository.create(create);
    }

    async fatal({
        action,
        description,
        apiKey,
        user,
        method,
        requestId,
        role,
        params,
        bodies,
        path,
        statusCode,
        tags,
    }: ILogger): Promise<Logger> {
        const create: LoggerEntity = {
            level: ENUM_LOGGER_LEVEL.FATAL,
            user: user,
            apiKey: apiKey,
            anonymous: user ? false : true,
            action,
            description,
            method,
            requestId,
            role: role ? role._id : undefined,
            accessFor: role && role.accessFor ? role.accessFor : undefined,
            params,
            bodies,
            path,
            statusCode,
            tags,
        };

        return this.loggerRepository.create(create);
    }

    async raw({
        level,
        action,
        description,
        apiKey,
        user,
        method,
        requestId,
        role,
        params,
        bodies,
        path,
        statusCode,
        tags,
    }: ILoggerRaw): Promise<Logger> {
        const create: LoggerEntity = {
            level,
            user: user,
            apiKey: apiKey,
            anonymous: user ? false : true,
            action,
            description,
            method,
            requestId,
            role: role ? role._id : undefined,
            accessFor: role && role.accessFor ? role.accessFor : undefined,
            params,
            bodies,
            path,
            statusCode,
            tags,
        };

        return this.loggerRepository.create(create);
    }
}
