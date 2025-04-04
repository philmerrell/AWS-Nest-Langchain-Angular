// src/models/models.controller.ts
import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ModelWithPricingDto } from './model.dto';
import { ModelService } from './model.service';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';

@Controller('models')
export class ModelsController {
  constructor(private modelService: ModelService) {}

  @Get()
  @UseGuards(EntraAuthGuard)
  async getModels(@Req() req: any) {
    const user = req.user;
    const models = await this.modelService.getModelsWithPricing(user.roles);
    return models;
  }

  @Get('default')
  @UseGuards(EntraAuthGuard)
  async getDefaultModel() {
    return this.modelService.getDefaultModel();
  }

  @Get(':modelId')
  @UseGuards(EntraAuthGuard)
  async getModel(@Param('modelId') modelId: string) {
    return this.modelService.getModelWithPricing(modelId);
  }

  @Post()
  @UseGuards(EntraAuthGuard)
  @Roles(Role.DotNetDevelopers)
  async createModel(@Body() modelDto: ModelWithPricingDto, @Req() req: any) {
    const user = req.user;
    return this.modelService.createOrUpdateModelWithPricing(modelDto);
  }

  @Put(':modelId')
  @UseGuards(EntraAuthGuard)
  @Roles(Role.DotNetDevelopers)
  async updateModel(
    @Param('modelId') modelId: string,
    @Body() modelDto: ModelWithPricingDto,
    @Req() req: any
  ) {
    // Ensure the modelId in the path matches the one in the body
    if (modelId !== modelDto.modelId) {
      throw new Error('Model ID in path does not match model ID in body');
    }
    
    const user = req.user;
    return this.modelService.createOrUpdateModelWithPricing(modelDto);
  }

  @Put(':modelId/default')
  @UseGuards(EntraAuthGuard)
  @Roles(Role.DotNetDevelopers)
  async setDefaultModel(@Param('modelId') modelId: string) {
    return this.modelService.setDefaultModel(modelId);
  }
}