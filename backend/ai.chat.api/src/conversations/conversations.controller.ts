import { Controller, Req, Get, UseGuards, Param, Post, Body, Delete, Patch } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationSharingService } from './conversation-sharing.service';
import { GetShareableLinkDto, ShareConversationDto } from './share-conversation.dto';
import { MessageService } from 'src/messages/message.service';
import { RenameConversationDto } from './rename-conversation.dto';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { StarConversationDto } from './star-conversation.dto';

@Controller('conversations')
export class ConversationsController {

    constructor(
        private messageService: MessageService,
        private conversationService: ConversationService,
        private conversationSharingService: ConversationSharingService) { }

    @Get()
    @UseGuards(EntraAuthGuard)
    async getConversations(@Req() req: any) {
        const user = req.user;
        const conversations = await this.conversationService.getConversations(user.emplId);
        return conversations;
    }

    @Get(':conversationId')
    @UseGuards(EntraAuthGuard)
    async getConversationById(@Req() req: any) {
        const user = req.user;
        const conversationId = req.params.conversationId
        const conversation = await this.conversationService.getConversationById(user.emplId, conversationId);
        return conversation;
    }


    @Patch(':conversationId/name')
    @UseGuards(EntraAuthGuard)
    async updateConversationName(
        @Param('conversationId') conversationId: string,
        @Body() renameDto: RenameConversationDto,
        @Req() req: any
    ) {
        const user = req.user;
        await this.conversationService.updateConversationName(user.emplId, conversationId, renameDto.name);
        return { success: true };
    }

    @Delete(':conversationId')
    @UseGuards(EntraAuthGuard)
    async deleteConversation(@Param('conversationId') conversationId: string, @Req() req: any) {
        const user = req.user;

        // First delete all messages
        await this.messageService.deleteConversationMessages(conversationId, user.emplId);

        // Then delete the conversation itself
        await this.conversationService.deleteConversation(user.emplId, conversationId);

        return { success: true, message: 'Conversation and messages deleted successfully' };
    }

    @Post('share')
    @UseGuards(EntraAuthGuard)
    async shareConversation(@Body() shareDto: ShareConversationDto, @Req() req: any) {
        const user = req.user;
        return this.conversationSharingService.shareConversation(shareDto, user);
    }

    @Patch(':conversationId/star')
    @UseGuards(EntraAuthGuard)
    async starConversation(
        @Param('conversationId') conversationId: string,
        @Body() starDto: StarConversationDto,
        @Req() req: any
    ) {
        const user = req.user;
        await this.conversationService.toggleStar(user.emplId, conversationId, starDto.isStarred);
        return { success: true };
    }

    @Get('shared')
    @UseGuards(EntraAuthGuard)
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
    @UseGuards(EntraAuthGuard)
    async getShareableLink(@Param() params: GetShareableLinkDto) {
        return {
            link: await this.conversationSharingService.generateShareableLink(params.sharedConversationId)
        };
    }



}
