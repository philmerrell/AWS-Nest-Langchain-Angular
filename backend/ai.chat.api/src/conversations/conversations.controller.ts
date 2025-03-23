import { Controller, Req, Get, UseGuards, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {

    constructor(private configService: ConfigService, private conversationService: ConversationService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getConversations(@Req() req: any) {
        const user = req.user;
        const conversations = await this.conversationService.getConversations(user.emplId);
        return conversations;
    }

    @Get(':conversationId')
    @UseGuards(JwtAuthGuard)
    async getConversationById(@Req() req: any) {
        const user = req.user;
        const conversationId = req.params.conversationId
        const conversation = await this.conversationService.getConversationById(user.emplId, conversationId);
        return conversation;
    }



}
