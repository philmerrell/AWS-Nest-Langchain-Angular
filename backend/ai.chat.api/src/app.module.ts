import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [ChatController, ConversationsController, MessagesController, ModelsController, ReportingController],
  providers: [AppService, ChatService, CostService, ConversationService, MessageService, ModelService, ModelPricingService, ReportingService],
})
export class AppModule {}
