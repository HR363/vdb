import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createConversation(data: { buyerId: string; sellerId: string; postId?: string }) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        postId: data.postId ?? null,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        postId: data.postId ?? null,
      },
    });
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
            referencedPost: {
              include: { seller: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async listConversations(params: { userId: string; role: 'buyer' | 'seller' }) {
    const where =
      params.role === 'buyer'
        ? { buyerId: params.userId }
        : { sellerId: params.userId };

    return this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        buyer: true,
        seller: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
