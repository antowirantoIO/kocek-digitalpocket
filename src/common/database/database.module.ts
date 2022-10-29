import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { ENUM_DATABASE_TYPE } from 'src/common/database/constants/database.enum.constant';
import { DatabaseOptionsModule } from 'src/common/database/database.options.module';
import { IDatabaseConnectOptions } from 'src/common/database/interfaces/database.interface';
import { DatabaseOptionsService } from 'src/common/database/services/database.options.service';
import { DatabaseService } from 'src/common/database/services/database.service';

@Global()
@Module({
    controllers: [],
    providers: [DatabaseService],
    exports: [DatabaseService],
    imports: [],
})
export class DatabaseModule {}

@Module({})
export class DatabaseConnectModule {
    static register(options: IDatabaseConnectOptions): DynamicModule {
        const module =
            process.env.DATABASE_TYPE === ENUM_DATABASE_TYPE.MONGO
                ? MongooseModule.forFeature(
                      [
                          {
                              name: options.name,
                              schema:
                                  'mongo' in options.schema
                                      ? options.schema.mongo
                                      : options.schema,
                              collection: options.collection,
                          },
                      ],
                      options.connectionName
                  )
                : TypeOrmModule.forFeature(
                      [
                          'postgres' in options.schema
                              ? options.schema.postgres
                              : options.schema,
                          {
                              options: {
                                  name: options.name,
                                  tableName: options.collection,
                                  schema:
                                      'postgres' in options.schema
                                          ? options.schema.postgres
                                          : options.schema,
                              },
                          },
                      ],
                      options.connectionName
                  );

        return {
            module: DatabaseConnectModule,
            controllers: [],
            providers: [],
            exports: [module],
            imports: [module],
        };
    }
}

@Module({})
export class DatabaseInitModule {
    static register(): DynamicModule {
        if (process.env.DATABASE_TYPE === ENUM_DATABASE_TYPE.MONGO) {
            return {
                module: DatabaseInitModule,
                controllers: [],
                providers: [],
                exports: [],
                imports: [
                    MongooseModule.forRootAsync({
                        connectionName: DATABASE_CONNECTION_NAME,
                        inject: [DatabaseOptionsService],
                        imports: [DatabaseOptionsModule],
                        useFactory: (
                            databaseOptionsService: DatabaseOptionsService
                        ) => databaseOptionsService.createMongooseOptions(),
                    }),
                ],
            };
        }

        return {
            module: DatabaseInitModule,
            controllers: [],
            providers: [],
            exports: [],
            imports: [
                TypeOrmModule.forRootAsync({
                    name: DATABASE_CONNECTION_NAME,
                    inject: [DatabaseOptionsService],
                    imports: [DatabaseOptionsModule],
                    useFactory: (
                        databaseOptionsService: DatabaseOptionsService
                    ) => databaseOptionsService.createTypeOrmOptions(),
                }),
            ],
        };
    }
}
