import { Injectable } from '@nestjs/common';
import { IAuthPermission } from 'src/common/auth/interfaces/auth.interface';
import {
    IDatabaseCreateManyOptions,
    IDatabaseManyOptions,
} from 'src/common/database/interfaces/database.interface';
import { IPermissionBulkService } from 'src/modules/permission/interfaces/permission.bulk-service.interface';
import { PermissionRepository } from 'src/modules/permission/repositories/permission.repository';
import { PermissionEntity } from 'src/modules/permission/schemas/permission.schema';

@Injectable()
export class PermissionBulkService implements IPermissionBulkService {
    constructor(private readonly permissionRepository: PermissionRepository) {}

    async createMany(
        data: IAuthPermission[],
        options?: IDatabaseCreateManyOptions
    ): Promise<boolean> {
        const map: PermissionEntity[] = data.map(
            ({ isActive, code, description, name }) => {
                const create = new PermissionEntity();
                create.code = code;
                create.name = name;
                create.description = description;
                create.isActive = isActive || true;

                return create;
            }
        );

        return this.permissionRepository.createMany<PermissionEntity>(
            map,
            options
        );
    }

    async deleteMany(
        find: Record<string, any>,
        options?: IDatabaseManyOptions
    ): Promise<boolean> {
        return this.permissionRepository.deleteMany(find, options);
    }
}
