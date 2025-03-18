import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationService } from './conversations/conversation.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, ChatController, ConversationsController],
  providers: [AppService, ChatService, ConversationService],
})
export class AppModule {}
