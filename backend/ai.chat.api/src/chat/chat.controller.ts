import { Body, Controller, Post, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';

@Controller('chat')
export class ChatController {

    constructor(private chatService: ChatService) {}

    @Post()
    async chat(@Body() chatRequestDto: ChatRequestDto, @Res() res: Response) {
      console.log('chatRequestDto', chatRequestDto);
        return this.chatService.streamChat(chatRequestDto, res);
      }
}
