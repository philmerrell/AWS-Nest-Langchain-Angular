import { Body, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { MessageService } from './message.service';
import { ConversationDto } from 'src/conversations/conversation.dto';

@Controller('messages')
export class MessagesController {
    constructor(private messageService: MessageService) {}

    @Get()
    @UseGuards(EntraAuthGuard)
    async getMessages(@Body() conversationDto: ConversationDto, @Req() req: any) {
        const user = req.user;
        const messages = await this.messageService.getMessages(conversationDto.conversationId, user.email);
        return messages;
    }
}
