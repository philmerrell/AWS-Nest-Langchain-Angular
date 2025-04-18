import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationService } from './conversations/conversation.service';
import { AuthModule } from './auth/auth.module';
import { MessageService } from './messages/message.service';
import { MessagesController } from './messages/messages.controller';
import { ModelsController } from './models/models.controller';
import { ModelService } from './models/model.service';
import { CostService } from './cost/cost.service';
import { ModelPricingService } from './cost/model-pricing.service';
import { ReportingController } from './reporting/reporting.controller';
import { ReportingService } from './reporting/reporting.service';
import { UsageLimitService } from './chat/usage-limit.service';
import { ConversationSharingService } from './conversations/conversation-sharing.service';
import { McpService } from './mcp/mcp.service';
import { AppController } from './app.controller';
import { BedrockChatService } from './chat/bedrock-chat.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [
    AppController,
    ChatController,
    ConversationsController,
    MessagesController,
    ModelsController,
    ReportingController
  ],
  providers: [
    BedrockChatService,
    CostService,
    ConversationService,
    ConversationSharingService,
    MessageService,
    ModelService,
    ModelPricingService,
    ReportingService,
    UsageLimitService,
    McpService
  ],
})
export class AppModule {}
