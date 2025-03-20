import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';

@Controller('chat')
export class ChatController {

  constructor(private chatService: ChatService) { }

  @Post()
  @UseGuards(EntraAuthGuard)
  async chat(@Body() chatRequestDto: ChatRequestDto, @Res() res: Response, @Req() req: any) {
    const user = req.user;
    return this.chatService.streamChat(chatRequestDto, res, user);
  }

  @Get()
  @UseGuards(EntraAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async test(@Req() req: any) {
    const user = req.user;
    return { message: 'Hello World', user };
  }
}
