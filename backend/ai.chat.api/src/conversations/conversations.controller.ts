import { Controller, Req, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';

@Controller('conversations')
export class ConversationsController {

    constructor(private configService: ConfigService, private conversationService: ConversationService) { }

    @Get()
    @UseGuards(EntraAuthGuard)
    async getConversations(@Req() req: any) {
        const user = req.user;
        const conversations = await this.conversationService.getConversations(user.email);
        return conversations;
    }



}
