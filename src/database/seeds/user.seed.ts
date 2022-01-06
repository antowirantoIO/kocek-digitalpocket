import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { Logger as DebuggerService } from 'winston';
import { Debugger } from 'src/debugger/debugger.decorator';

import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';
import { RoleDocument } from 'src/role/role.interface';

@Injectable()
export class UserSeed {
    constructor(
        @Debugger() private readonly debuggerService: DebuggerService,
        private readonly userService: UserService,
        private readonly roleService: RoleService
    ) {}

    @Command({
        command: 'insert:user',
        describe: 'insert users'
    })
    async insert(): Promise<void> {
        const role: RoleDocument = await this.roleService.findOne<RoleDocument>(
            {
                name: 'admin'
            }
        );

        try {
            await this.userService.create({
                firstName: 'admin',
                lastName: 'test',
                email: 'admin@mail.com',
                password: 'aaAA@@123444',
                mobileNumber: '08111111111',
                role: role._id
            });

            this.debuggerService.info('Insert User Succeed', {
                class: 'UserSeed',
                function: 'insert'
            });
        } catch (e) {
            this.debuggerService.error(e.message, {
                class: 'UserSeed',
                function: 'insert'
            });
        }
    }

    @Command({
        command: 'remove:user',
        describe: 'remove users'
    })
    async remove(): Promise<void> {
        try {
            await this.userService.deleteMany({});

            this.debuggerService.info('Remove User Succeed', {
                class: 'UserSeed',
                function: 'remove'
            });
        } catch (e) {
            this.debuggerService.error(e.message, {
                class: 'UserSeed',
                function: 'remove'
            });
        }
    }
}
