import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async createConversation(
    @Body() data: { buyerId: string; sellerId: string; postId?: string },
  ) {
    return this.conversationsService.createConversation(data);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @Get()
  async listConversations(
    @Query('userId') userId: string,
    @Query('role') role: 'buyer' | 'seller',
  ) {
    return this.conversationsService.listConversations({ userId, role });
  }
}
