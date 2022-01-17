import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/database/database.constant';
import { RoleBulkService, RoleService } from 'src/role/role.service';
import { RoleDatabaseName, RoleEntity, RoleSchema } from './role.schema';

@Module({
    controllers: [],
    providers: [RoleService, RoleBulkService],
    exports: [RoleService, RoleBulkService],
    imports: [
        MongooseModule.forFeature(
            [
                {
                    name: RoleEntity.name,
                    schema: RoleSchema,
                    collection: RoleDatabaseName,
                },
            ],
            DATABASE_CONNECTION_NAME
        ),
    ],
})
export class RoleModule {}
