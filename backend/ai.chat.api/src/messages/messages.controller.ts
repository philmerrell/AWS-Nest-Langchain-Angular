import { Body, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { MessageService } from './message.service';
import { ConversationDto } from 'src/conversations/conversation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
    constructor(private messageService: MessageService) {}

    @Get(':conversationId')
    @UseGuards(JwtAuthGuard)
    async getMessages(@Req() req: any) {
        const conversationId = req.params.conversationId;
        const user = req.user;
        const messages = await this.messageService.getMessages(conversationId, user.emplId);
        return messages;
    }
}
