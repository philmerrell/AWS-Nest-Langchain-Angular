// src/models/models.controller.ts
import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ModelWithPricingDto } from './model.dto';
import { ModelService } from './model.service';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('models')
export class ModelsController {
  constructor(private modelService: ModelService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getModels(@Req() req: any) {
    const user = req.user;
    const models = await this.modelService.getModels();
    return models;
  }

  @Get(':modelId')
  @UseGuards(JwtAuthGuard)
  async getModel(@Param('modelId') modelId: string) {
    return this.modelService.getModel(modelId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.DotNetDevelopers)
  async createModel(@Body() modelDto: ModelWithPricingDto, @Req() req: any) {
    const user = req.user;
    return this.modelService.createOrUpdateModel(modelDto);
  }

  @Put(':modelId')
  @UseGuards(JwtAuthGuard)
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
    return this.modelService.createOrUpdateModel(modelDto);
  }
}