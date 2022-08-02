import { Controller, Get, Query } from '@nestjs/common';
import { PaginationService } from 'src/common/pagination/services/pagination.service';
import { RequestParamGuard } from 'src/common/request/request.decorator';
import {
    Response,
    ResponsePaging,
} from 'src/common/response/response.decorator';
import {
    IResponse,
    IResponsePaging,
} from 'src/common/response/response.interface';
import { SettingListDto } from '../dtos/setting.list.dto';
import { SettingRequestDto } from '../dtos/setting.request.dto';
import { SettingDocument } from '../schemas/setting.schema';
import { SettingGetSerialization } from '../serializations/setting.get.serialization';
import { SettingListSerialization } from '../serializations/setting.list.serialization';
import { SettingService } from '../services/setting.service';
import {
    GetSetting,
    SettingGetByNameGuard,
    SettingGetGuard,
} from '../setting.decorator';

@Controller({
    version: '1',
    path: '/setting',
})
export class SettingController {
    constructor(
        private readonly settingService: SettingService,
        private readonly paginationService: PaginationService
    ) {}

    @ResponsePaging('setting.list', SettingListSerialization)
    @Get('/list')
    async list(
        @Query()
        {
            page,
            perPage,
            sort,
            search,
            availableSort,
            availableSearch,
        }: SettingListDto
    ): Promise<IResponsePaging> {
        const skip: number = await this.paginationService.skip(page, perPage);
        let find: Record<string, any> = {};

        if (search) {
            find = {
                ...find,
                ...search,
            };
        }
        const settings: SettingDocument[] = await this.settingService.findAll(
            find,
            {
                limit: perPage,
                skip: skip,
                sort,
            }
        );
        const totalData: number = await this.settingService.getTotal(find);
        const totalPage: number = await this.paginationService.totalPage(
            totalData,
            perPage
        );

        return {
            totalData,
            totalPage,
            currentPage: page,
            perPage,
            availableSearch,
            availableSort,
            data: settings,
        };
    }

    @Response('setting.get', SettingGetSerialization)
    @SettingGetGuard()
    @RequestParamGuard(SettingRequestDto)
    @Get('get/:setting')
    async get(@GetSetting() setting: SettingDocument): Promise<IResponse> {
        return setting;
    }

    @Response('setting.getByName', SettingGetSerialization)
    @SettingGetByNameGuard()
    @Get('get/name/:settingName')
    async getByName(
        @GetSetting() setting: SettingDocument
    ): Promise<IResponse> {
        return setting;
    }
}
