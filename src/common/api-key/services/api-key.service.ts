import { Injectable } from '@nestjs/common';
import {
    IDatabaseCreateOptions,
    IDatabaseSoftDeleteOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneOptions,
    IDatabaseOptions,
    IDatabaseManyOptions,
} from 'src/common/database/interfaces/database.interface';
import { IApiKeyService } from 'src/common/api-key/interfaces/api-key.service.interface';
import { IApiKeyEntity } from 'src/common/api-key/interfaces/api-key.interface';
import { ApiKeyEntity } from 'src/common/api-key/repository/entities/api-key.entity';
import { ApiKeyRepository } from 'src/common/api-key/repository/repositories/api-key.repository';
import { ApiKeyActiveDto } from 'src/common/api-key/dtos/api-key.active.dto';
import { ApiKeyResetDto } from 'src/common/api-key/dtos/api-key.reset.dto';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';
import { ConfigService } from '@nestjs/config';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import {
    ApiKeyCreateDto,
    ApiKeyCreateRawDto,
} from 'src/common/api-key/dtos/api-key.create.dto';
import { ApiKeyUpdateNameDto } from 'src/common/api-key/dtos/api-key.update-name.dto';

@Injectable()
export class ApiKeyService implements IApiKeyService {
    private readonly env: string;

    constructor(
        private readonly helperStringService: HelperStringService,
        private readonly configService: ConfigService,
        private readonly helperHashService: HelperHashService,
        private readonly apiKeyRepository: ApiKeyRepository
    ) {
        this.env = this.configService.get<string>('app.env');
    }

    async findAll(
        find?: Record<string, any>,
        options?: IDatabaseFindAllOptions
    ): Promise<ApiKeyEntity[]> {
        return this.apiKeyRepository.findAll<ApiKeyEntity>(find, options);
    }

    async findOneById(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.findOneById<ApiKeyEntity>(_id, options);
    }

    async findOne(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.findOne<ApiKeyEntity>(find, options);
    }

    async findOneByKey(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.findOne<ApiKeyEntity>({ key }, options);
    }

    async findOneByActiveKey(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.findOne<ApiKeyEntity>(
            { key, isActive: true },
            options
        );
    }

    async getTotal(
        find?: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<number> {
        return this.apiKeyRepository.getTotal(find, options);
    }

    async active(
        _id: string,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity> {
        const dto: ApiKeyActiveDto = new ApiKeyActiveDto();
        dto.isActive = true;

        return this.apiKeyRepository.updateOneById<ApiKeyActiveDto>(
            _id,
            dto,
            options
        );
    }

    async inactive(
        _id: string,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity> {
        const dto: ApiKeyActiveDto = new ApiKeyActiveDto();
        dto.isActive = false;

        return this.apiKeyRepository.updateOneById<ApiKeyActiveDto>(
            _id,
            dto,
            options
        );
    }

    async create(
        { name, description }: ApiKeyCreateDto,
        options?: IDatabaseCreateOptions
    ): Promise<IApiKeyEntity> {
        const key = await this.createKey();
        const secret = await this.createSecret();
        const hash: string = await this.createHashApiKey(key, secret);

        const dto: ApiKeyEntity = new ApiKeyEntity();
        dto.name = name;
        dto.description = description;
        dto.key = key;
        dto.hash = hash;
        dto.isActive = true;

        const created: ApiKeyEntity =
            await this.apiKeyRepository.create<ApiKeyEntity>(dto, options);

        return { ...created, secret };
    }

    async createRaw(
        { name, description, key, secret }: ApiKeyCreateRawDto,
        options?: IDatabaseCreateOptions
    ): Promise<IApiKeyEntity> {
        const hash: string = await this.createHashApiKey(key, secret);

        const dto: ApiKeyEntity = new ApiKeyEntity();
        dto.name = name;
        dto.description = description;
        dto.key = key;
        dto.hash = hash;
        dto.isActive = true;

        const created: ApiKeyEntity =
            await this.apiKeyRepository.create<ApiKeyEntity>(dto, options);

        return { ...created, secret };
    }

    async updateName(
        _id: string,
        data: ApiKeyUpdateNameDto,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.updateOneById<ApiKeyUpdateNameDto>(
            _id,
            data,
            options
        );
    }

    async reset(
        _id: string,
        key: string,
        options?: IDatabaseOptions
    ): Promise<IApiKeyEntity> {
        const secret: string = await this.createSecret();
        const hash: string = await this.createHashApiKey(key, secret);

        const dto: ApiKeyResetDto = new ApiKeyResetDto();
        dto.hash = hash;

        const apiKey: ApiKeyEntity =
            await this.apiKeyRepository.updateOneById<ApiKeyResetDto>(
                _id,
                dto,
                options
            );

        return { ...apiKey, secret };
    }

    async deleteOneById(
        _id: string,
        options?: IDatabaseSoftDeleteOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.deleteOneById(_id, options);
    }

    async deleteOne(
        find: Record<string, any>,
        options?: IDatabaseSoftDeleteOptions
    ): Promise<ApiKeyEntity> {
        return this.apiKeyRepository.deleteOne(find, options);
    }

    async validateHashApiKey(
        hashFromRequest: string,
        hash: string
    ): Promise<boolean> {
        return this.helperHashService.sha256Compare(hashFromRequest, hash);
    }

    async createKey(): Promise<string> {
        return this.helperStringService.random(25, {
            safe: false,
            upperCase: true,
            prefix: `${this.env}_`,
        });
    }

    async createSecret(): Promise<string> {
        return this.helperStringService.random(35, {
            safe: false,
            upperCase: true,
        });
    }

    async createHashApiKey(key: string, secret: string): Promise<string> {
        return this.helperHashService.sha256(`${key}:${secret}`);
    }

    async deleteMany(
        find: Record<string, any>,
        options?: IDatabaseManyOptions
    ): Promise<boolean> {
        return this.apiKeyRepository.deleteMany(find, options);
    }
}
