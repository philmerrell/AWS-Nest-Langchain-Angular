import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { ModelCreateDto } from './model.dto';
import { ModelService } from './model.service';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';

@Controller('models')
export class ModelsController {

    constructor(private modelService: ModelService) { }

    @Get()
    @UseGuards(EntraAuthGuard)
    async getModels(@Req() req: any) {
        const user = req.user;
        const models = await this.modelService.getModels();
        return models;
    }

    @Post()
    @UseGuards(EntraAuthGuard)
    @Roles(Role.DotNetDevelopers)
    async createModel(@Body() modelDto: ModelCreateDto, @Req() req: any) {
        const user = req.user;
        return this.modelService.createModel(modelDto);
    }
}
