import {
    UseGuards,
    createParamDecorator,
    ExecutionContext,
    applyDecorators,
    SetMetadata
} from '@nestjs/common';
import { PermissionDefaultGuard } from 'src/permission/guard/permission.default.guard';
import {
    ENUM_PERMISSIONS,
    PERMISSION_META_KEY
} from 'src/permission/permission.constant';
import { BasicGuard } from './guard/basic/auth.basic.guard';
import { AuthDefaultGuard } from './guard/default/auth.default.guard';
import { AuthExpiredGuard } from './guard/default/auth.expired.guard';
import { JwtRefreshGuard } from './guard/jwt-refresh/auth.jwt-refresh.guard';
import { JwtGuard } from './guard/jwt/auth.jwt.guard';

export function AuthJwtGuard(...permissions: ENUM_PERMISSIONS[]): any {
    return applyDecorators(
        UseGuards(
            JwtGuard,
            AuthExpiredGuard,
            AuthDefaultGuard,
            PermissionDefaultGuard
        ),
        SetMetadata(PERMISSION_META_KEY, permissions)
    );
}

export function AuthBasicGuard(): any {
    return applyDecorators(UseGuards(BasicGuard));
}

export function AuthJwtRefreshGuard(): any {
    return applyDecorators(UseGuards(JwtRefreshGuard));
}

export const User = createParamDecorator(
    (data: string, ctx: ExecutionContext): Record<string, any> => {
        const { user } = ctx.switchToHttp().getRequest();
        return data ? user[data] : user;
    }
);

export const Token = createParamDecorator(
    (data: string, ctx: ExecutionContext): string => {
        const { headers } = ctx.switchToHttp().getRequest();
        const { authorization } = headers;
        return authorization ? authorization.split(' ')[1] : undefined;
    }
);
