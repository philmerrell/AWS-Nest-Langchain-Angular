import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { MessageDto } from './chat-request.dto';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';

@Controller('chat')
export class ChatController {

  constructor(private chatService: ChatService) { }

  @Post()
  async chat(@Body() messageDto: MessageDto, @Res() res: Response) {
    // return this.chatService.streamChat(messageDto, res);
  }

  @Get()
  @UseGuards(EntraAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async test() {
    return { message: 'Hello World' };
  }
}
