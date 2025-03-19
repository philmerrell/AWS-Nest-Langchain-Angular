import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationService } from './conversations/conversation.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [ChatController, ConversationsController],
  providers: [AppService, ChatService, ConversationService],
})
export class AppModule {}
