import { Exclude, Transform, Type } from 'class-transformer';
import { IAwsResponse } from 'src/aws/aws.interface';
import { IRoleFullDocument } from 'src/role/role.interface';

export class UserProfileTransformer {
    @Type(() => String)
    readonly _id: string;

    @Transform(
        ({ value }) => ({
            name: value.name,
            permissions: value.permissions.map(
                (val: Record<string, any>) => val.name
            ),
            isActive: value.isActive
        }),
        { toClassOnly: true }
    )
    readonly role: IRoleFullDocument;

    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly mobileNumber: string;
    readonly photo?: IAwsResponse;

    @Exclude()
    readonly password: string;

    @Exclude()
    readonly createdAt: Date;

    @Exclude()
    readonly updatedAt: Date;
}
