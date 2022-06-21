import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpCode,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    Patch,
} from '@nestjs/common';
import { ENUM_USER_STATUS_CODE_ERROR } from 'src/user/user.constant';
import { ENUM_ROLE_STATUS_CODE_ERROR } from 'src/role/role.constant';
import { UserService } from 'src/user/service/user.service';
import { AuthService } from '../service/auth.service';
import {
    ENUM_AUTH_STATUS_CODE_ERROR,
    ENUM_AUTH_STATUS_CODE_SUCCESS,
} from '../auth.constant';
import { Response } from 'src/utils/response/response.decorator';
import { IResponse } from 'src/utils/response/response.interface';
import { IUserDocument } from 'src/user/user.interface';
import { SuccessException } from 'src/utils/error/error.exception';
import { ENUM_LOGGER_ACTION } from 'src/logger/logger.constant';
import {
    ApiKey,
    AuthJwtGuard,
    AuthRefreshJwtGuard,
    Token,
    User,
} from '../auth.decorator';
import { ENUM_STATUS_CODE_ERROR } from 'src/utils/error/error.constant';
import { DebuggerService } from 'src/debugger/service/debugger.service';
import { LoggerService } from 'src/logger/service/logger.service';
import { UserDocument } from 'src/user/schema/user.schema';
import { AuthLoginDto } from '../dto/auth.login.dto';
import { AuthChangePasswordDto } from '../dto/auth.change-password.dto';
import { AuthLoginSerialization } from '../serialization/auth.login.serialization';
import { IAuthApiPayload } from '../auth.interface';
import { RequestId } from 'src/utils/request/request.decorator';

@Controller({
    version: '1',
    path: '/auth',
})
export class AuthCommonController {
    constructor(
        private readonly debuggerService: DebuggerService,
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly loggerService: LoggerService
    ) {}

    @Response('auth.login', {
        statusCode: ENUM_AUTH_STATUS_CODE_SUCCESS.AUTH_LOGIN_SUCCESS,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/login')
    async login(
        @Body() body: AuthLoginDto,
        @ApiKey() apiKey: IAuthApiPayload,
        @RequestId() requestId: string
    ): Promise<IResponse> {
        const rememberMe: boolean = body.rememberMe ? true : false;
        const user: IUserDocument =
            await this.userService.findOne<IUserDocument>(
                {
                    email: body.email,
                },
                {
                    populate: {
                        role: true,
                        permission: true,
                    },
                }
            );

        if (!user) {
            this.debuggerService.error(requestId, {
                description: 'Authorized error user not found',
                class: 'AuthController',
                function: 'login',
            });

            throw new NotFoundException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.USER_NOT_FOUND_ERROR,
                message: 'user.error.notFound',
            });
        }

        const validate: boolean = await this.authService.validateUser(
            body.password,
            user.password
        );

        if (!validate) {
            this.debuggerService.error(requestId, {
                description: 'Authorized error',
                class: 'AuthController',
                function: 'login',
            });

            throw new BadRequestException({
                statusCode:
                    ENUM_AUTH_STATUS_CODE_ERROR.AUTH_PASSWORD_NOT_MATCH_ERROR,
                message: 'auth.error.passwordNotMatch',
            });
        } else if (!user.isActive) {
            this.debuggerService.error(requestId, {
                description: 'Auth Block',
                class: 'AuthController',
                function: 'login',
            });

            throw new ForbiddenException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.USER_IS_INACTIVE_ERROR,
                message: 'user.error.inactive',
            });
        } else if (!user.role.isActive) {
            this.debuggerService.error(requestId, {
                description: 'Role Block',
                class: 'AuthController',
                function: 'login',
            });

            throw new ForbiddenException({
                statusCode: ENUM_ROLE_STATUS_CODE_ERROR.ROLE_IS_INACTIVE_ERROR,
                message: 'role.error.inactive',
            });
        }

        const safe: AuthLoginSerialization =
            await this.authService.serializationLogin(user);

        const payloadAccessToken: Record<string, any> =
            await this.authService.createPayloadAccessToken(safe, rememberMe);
        const payloadRefreshToken: Record<string, any> =
            await this.authService.createPayloadRefreshToken(safe, rememberMe, {
                loginDate: payloadAccessToken.loginDate,
            });

        const accessToken: string = await this.authService.createAccessToken(
            payloadAccessToken
        );

        const refreshToken: string = await this.authService.createRefreshToken(
            payloadRefreshToken,
            rememberMe
        );

        const checkPasswordExpired: boolean =
            await this.authService.checkPasswordExpired(user.passwordExpired);

        if (checkPasswordExpired) {
            this.debuggerService.error(requestId, {
                description: 'Password expired',
                class: 'AuthController',
                function: 'login',
            });

            throw new SuccessException({
                statusCode:
                    ENUM_AUTH_STATUS_CODE_ERROR.AUTH_PASSWORD_EXPIRED_ERROR,
                message: 'auth.error.passwordExpired',
                data: {
                    accessToken,
                    refreshToken,
                },
            });
        }

        await this.loggerService.info({
            action: ENUM_LOGGER_ACTION.LOGIN,
            description: `${user._id} do login`,
            user: user._id,
            apiKey: apiKey?._id,
            tags: ['login', 'withEmail'],
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    @Response('auth.refresh')
    @AuthRefreshJwtGuard()
    @HttpCode(HttpStatus.OK)
    @Post('/refresh')
    async refresh(
        @User()
        { _id, rememberMe, loginDate }: Record<string, any>,
        @Token() refreshToken: string,
        @RequestId() requestId: string
    ): Promise<IResponse> {
        const user: IUserDocument =
            await this.userService.findOneById<IUserDocument>(_id, {
                populate: {
                    role: true,
                    permission: true,
                },
            });

        if (!user) {
            this.debuggerService.error(requestId, {
                description: 'Authorized error user not found',
                class: 'AuthController',
                function: 'refresh',
            });

            throw new NotFoundException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.USER_NOT_FOUND_ERROR,
                message: 'user.error.notFound',
            });
        } else if (!user.isActive) {
            this.debuggerService.error(requestId, {
                description: 'Auth Block',
                class: 'AuthController',
                function: 'refresh',
            });

            throw new ForbiddenException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.USER_IS_INACTIVE_ERROR,
                message: 'user.error.inactive',
            });
        } else if (!user.role.isActive) {
            this.debuggerService.error(requestId, {
                description: 'Role Block',
                class: 'AuthController',
                function: 'refresh',
            });

            throw new ForbiddenException({
                statusCode: ENUM_ROLE_STATUS_CODE_ERROR.ROLE_IS_INACTIVE_ERROR,
                message: 'role.error.inactive',
            });
        }

        const checkPasswordExpired: boolean =
            await this.authService.checkPasswordExpired(user.passwordExpired);

        if (checkPasswordExpired) {
            this.debuggerService.error(requestId, {
                description: 'Password expired',
                class: 'AuthController',
                function: 'refresh',
            });

            throw new ForbiddenException({
                statusCode:
                    ENUM_AUTH_STATUS_CODE_ERROR.AUTH_PASSWORD_EXPIRED_ERROR,
                message: 'auth.error.passwordExpired',
            });
        }

        const safe: AuthLoginSerialization =
            await this.authService.serializationLogin(user);
        const payloadAccessToken: Record<string, any> =
            await this.authService.createPayloadAccessToken(safe, rememberMe, {
                loginDate,
            });

        const accessToken: string = await this.authService.createAccessToken(
            payloadAccessToken
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    @Response('auth.changePassword')
    @AuthJwtGuard()
    @Patch('/change-password')
    async changePassword(
        @Body() body: AuthChangePasswordDto,
        @User('_id') _id: string,
        @RequestId() requestId: string
    ): Promise<void> {
        const user: UserDocument = await this.userService.findOneById(_id);
        if (!user) {
            this.debuggerService.error(requestId, {
                description: 'User not found',
                class: 'AuthController',
                function: 'changePassword',
            });

            throw new NotFoundException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.USER_NOT_FOUND_ERROR,
                message: 'user.error.notFound',
            });
        }

        const matchPassword: boolean = await this.authService.validateUser(
            body.oldPassword,
            user.password
        );
        if (!matchPassword) {
            this.debuggerService.error(requestId, {
                description: "Old password don't match",
                class: 'AuthController',
                function: 'changePassword',
            });

            throw new BadRequestException({
                statusCode:
                    ENUM_AUTH_STATUS_CODE_ERROR.AUTH_PASSWORD_NOT_MATCH_ERROR,
                message: 'auth.error.passwordNotMatch',
            });
        }

        const newMatchPassword: boolean = await this.authService.validateUser(
            body.newPassword,
            user.password
        );
        if (newMatchPassword) {
            this.debuggerService.error(requestId, {
                description: "New password cant't same with old password",
                class: 'AuthController',
                function: 'changePassword',
            });

            throw new BadRequestException({
                statusCode:
                    ENUM_AUTH_STATUS_CODE_ERROR.AUTH_PASSWORD_NEW_MUST_DIFFERENCE_ERROR,
                message: 'auth.error.newPasswordMustDifference',
            });
        }

        try {
            const password = await this.authService.createPassword(
                body.newPassword
            );

            await this.userService.updatePassword(user._id, password);
        } catch (e) {
            this.debuggerService.error(
                requestId,
                {
                    description: 'Change password error internal server error',
                    class: 'AuthController',
                    function: 'changePassword',
                },
                e
            );

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.UNKNOWN_ERROR,
                message: 'http.serverError.internalServerError',
            });
        }

        return;
    }
}
