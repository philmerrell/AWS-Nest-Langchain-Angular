import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { UsageLimitGuard } from 'src/auth/guards/usage-limit.guard';
import { ModelAccessGuard } from 'src/auth/guards/model-access.guard';
import { BedrockChatService } from './bedrock-chat.service';

@Controller('chat')
export class ChatController {

  constructor(private bedrockChatService: BedrockChatService) { }

  @Post()
  @UseGuards(EntraAuthGuard, UsageLimitGuard, ModelAccessGuard)
  async bedrockChat(@Body() chatRequestDto: ChatRequestDto, @Res() res: Response, @Req() req: any) {
    const user = req.user;
    return this.bedrockChatService.streamChat(chatRequestDto, res, user);
  }

  @Post('cancel/:requestId')
  @UseGuards(EntraAuthGuard)
  async cancelChat(@Param('requestId') requestId: string, @Res() res: Response) {
    const success = this.bedrockChatService.cancelStream(requestId);
    return res.status(200).json({ success, message: success ? 'Request canceled' : 'Request not found' });
  }

}
