import { Controller, Req, Get, UseGuards, Param, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConversationSharingService } from './conversation-sharing.service';
import { GetShareableLinkDto, ShareConversationDto } from './share-conversation.dto';

@Controller('conversations')
export class ConversationsController {

    constructor(
        private configService: ConfigService,
        private conversationService: ConversationService,
        private conversationSharingService: ConversationSharingService) { }

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

    @Post('share')
    @UseGuards(JwtAuthGuard)
    async shareConversation(@Body() shareDto: ShareConversationDto, @Req() req: any) {
        const user = req.user;
        return this.conversationSharingService.shareConversation(shareDto, user);
    }

    @Get('shared')
    @UseGuards(JwtAuthGuard)
    async getSharedConversations(@Req() req: any) {
        const user = req.user;
        return this.conversationSharingService.getSharedConversationsForUser(user);
    }

    @Get('shared/:sharedConversationId')
    async getSharedConversation(@Param('sharedConversationId') sharedConversationId: string) {
        return this.conversationSharingService.getSharedConversation(sharedConversationId);
    }

    @Get('shared/:sharedConversationId/messages')
    async getSharedConversationMessages(@Param('sharedConversationId') sharedConversationId: string) {
        return this.conversationSharingService.getSharedConversationMessages(sharedConversationId);
    }

    @Post('shared/:sharedConversationId/link')
    @UseGuards(JwtAuthGuard)
    async getShareableLink(@Param() params: GetShareableLinkDto) {
        return { 
          link: await this.conversationSharingService.generateShareableLink(params.sharedConversationId) 
        };
    }



}
