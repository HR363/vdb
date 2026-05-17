import { Controller, Post, Body } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async createMessage(
    @Body()
    data: {
      conversationId: string;
      senderId: string;
      text: string;
      referencedPostId?: string;
      referencedMediaIndex?: number;
    },
  ) {
    return this.messagesService.createMessage(data);
  }
}
