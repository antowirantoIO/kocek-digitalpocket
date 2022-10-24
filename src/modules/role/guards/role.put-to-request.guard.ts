import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { IRole } from 'src/modules/role/interfaces/role.interface';
import { RoleService } from 'src/modules/role/services/role.service';

@Injectable()
export class RolePutToRequestGuard implements CanActivate {
    constructor(private readonly roleService: RoleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { params } = request;
        const { role } = params;

        const check: IRole = await this.roleService.findOneById<IRole>(role, {
            populate: true,
        });
        request.__role = check;

        return true;
    }
}
