import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    text: string;
    referencedPostId?: string;
    referencedMediaIndex?: number;
  }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          text: data.text,
          referencedPostId: data.referencedPostId ?? null,
          referencedMediaIndex: data.referencedMediaIndex ?? null,
        },
        include: {
          sender: true,
          referencedPost: {
            include: { seller: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: {},
      }),
    ]);

    return message;
  }
}
