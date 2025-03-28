// Create src/models/guards/model-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ModelService } from 'src/models/model.service';

@Injectable()
export class ModelAccessGuard implements CanActivate {
  constructor(private modelService: ModelService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const modelId = request.body.modelId;

    if (!modelId) {
      return true; // No model specified, let other validators handle this
    }

    // Get the model details
    const model = await this.modelService.getModelWithPricing(modelId);
    
    // If model doesn't exist, let other validators handle it
    if (!model) {
      return true;
    }

    // If model has no role restrictions, allow access
    if (!model.allowedRoles || model.allowedRoles.length === 0) {
      return true;
    }

    // Check if user has any of the allowed roles
    const hasAccess = user.roles.some(role => model.allowedRoles.includes(role));
    
    if (!hasAccess) {
      throw new ForbiddenException({
        message: `You do not have access to the selected model. Please choose another model.`,
        error: 'Model Access Denied',
        details: {
          modelId,
          modelName: model.name,
          userRoles: user.roles,
        }
      });
    }

    return true;
  }
}