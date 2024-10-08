import {
    Body,
    ConflictException,
    Controller,
    InternalServerErrorException,
    NotFoundException,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientSession, Connection } from 'mongoose';
import { ENUM_APP_STATUS_CODE_ERROR } from 'src/app/enums/app.status-code.enum';
import { DatabaseConnection } from 'src/common/database/decorators/database.decorator';
import { Response } from 'src/common/response/decorators/response.decorator';
import { ApiKeyProtected } from 'src/modules/api-key/decorators/api-key.decorator';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { ENUM_COUNTRY_STATUS_CODE_ERROR } from 'src/modules/country/enums/country.status-code.enum';
import { CountryService } from 'src/modules/country/services/country.service';
import { EmailService } from 'src/modules/email/services/email.service';
import { ENUM_ROLE_STATUS_CODE_ERROR } from 'src/modules/role/enums/role.status-code.enum';
import { RoleService } from 'src/modules/role/services/role.service';
import { ENUM_USER_STATUS_CODE_ERROR } from 'src/modules/user/enums/user.status-code.enum';
import { UserPublicSignUpDoc } from 'src/modules/user/docs/user.public.doc';
import { UserSignUpRequestDto } from 'src/modules/user/dtos/request/user.sign-up.request.dto';
import { UserService } from 'src/modules/user/services/user.service';

@ApiTags('modules.public.user')
@Controller({
    version: '1',
    path: '/user',
})
export class UserPublicController {
    constructor(
        @DatabaseConnection() private readonly databaseConnection: Connection,
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly roleService: RoleService,
        private readonly emailService: EmailService,
        private readonly countryService: CountryService
    ) {}

    @UserPublicSignUpDoc()
    @Response('user.signUp')
    @ApiKeyProtected()
    @Post('/sign-up')
    async signUp(
        @Body()
        { email, name, password: passwordString, country }: UserSignUpRequestDto
    ): Promise<void> {
        const promises: Promise<any>[] = [
            this.roleService.findOneByName('user'),
            this.userService.existByEmail(email),
            this.countryService.findOneActiveById(country),
        ];

        const [role, emailExist, checkCountry] = await Promise.all(promises);

        if (!role) {
            throw new NotFoundException({
                statusCode: ENUM_ROLE_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'role.error.notFound',
            });
        } else if (!checkCountry) {
            throw new NotFoundException({
                statusCode: ENUM_COUNTRY_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'country.error.notFound',
            });
        } else if (emailExist) {
            throw new ConflictException({
                statusCode: ENUM_USER_STATUS_CODE_ERROR.EMAIL_EXIST,
                message: 'user.error.emailExist',
            });
        }

        const password = await this.authService.createPassword(passwordString);

        const session: ClientSession =
            await this.databaseConnection.startSession();
        session.startTransaction();

        try {
            await this.userService.signUp(
                role._id,
                {
                    email,
                    name,
                    password: passwordString,
                    country,
                },
                password,
                { session }
            );

            await this.emailService.sendWelcome({
                email,
                name,
            });

            await session.commitTransaction();
            await session.endSession();
        } catch (err: any) {
            await session.abortTransaction();
            await session.endSession();

            throw new InternalServerErrorException({
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err.message,
            });
        }

        return;
    }
}
