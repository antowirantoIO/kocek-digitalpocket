import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { CallbackWithoutResultAndOptionalError, Document } from 'mongoose';
import { ENUM_AUTH_TYPE } from 'src/common/auth/constants/auth.enum.constant';
import { DatabaseMongoUUIDEntityAbstract } from 'src/common/database/abstracts/mongo/entities/database.mongo.uuid.entity.abstract';
import { DatabaseEntity } from 'src/common/database/decorators/database.decorator';

export const RoleDatabaseName = 'roles';

@DatabaseEntity({ collection: RoleDatabaseName })
export class RoleEntity extends DatabaseMongoUUIDEntityAbstract {
    @Prop({
        required: true,
        index: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 30,
        type: String,
    })
    name: string;

    @Prop({
        required: false,
        trim: true,
        type: String,
    })
    description?: string;

    @Prop({
        required: true,
        default: true,
        index: true,
        type: Boolean,
    })
    isActive: boolean;

    @Prop({
        required: true,
        enum: ENUM_AUTH_TYPE,
        index: true,
        type: String,
    })
    type: ENUM_AUTH_TYPE;
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity);

export type RoleDoc = RoleEntity & Document;

RoleSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.name = this.name.toLowerCase();

    next();
});
