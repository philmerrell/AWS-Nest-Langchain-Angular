import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { EntraAuthGuard } from 'src/auth/guards/entra-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';
import { GoogleAuthGuard } from 'src/auth/guards/google-auth.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsageLimitGuard } from 'src/auth/guards/usage-limit.guard';

@Controller('chat')
export class ChatController {

  constructor(private chatService: ChatService) { }

  @Post()
  @UseGuards(JwtAuthGuard, UsageLimitGuard)
  async chat(@Body() chatRequestDto: ChatRequestDto, @Res() res: Response, @Req() req: any) {
    const user = req.user;
    return this.chatService.streamChat(chatRequestDto, res, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.DotNetDevelopers)
  async test(@Req() req: any) {
    const user = req.user;
    return { message: 'Hello, Developer.', user };
  }
}
