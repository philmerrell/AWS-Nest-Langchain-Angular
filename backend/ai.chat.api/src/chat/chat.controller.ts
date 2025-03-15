import { Body, Controller, Post, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';

@Controller('chat')
export class ChatController {

    constructor(private chatService: ChatService) {}

    @Post()
    async chat(@Body('message') message: string, @Res() res: Response) {
        return this.chatService.streamChat(message, res);
      }
}
