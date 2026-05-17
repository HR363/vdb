import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Conversation, Message, Post, User } from '../../core/api.types';

type ConversationDetail = Conversation & {
  buyer?: User;
  seller?: User;
  messages?: UiMessage[];
  post?: Post | null;
};

type UiMessage = Message & {
  optimistic?: boolean;
  status?: 'sending' | 'sent' | 'error';
};

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly activeConversation = signal<ConversationDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly messageText = signal('');
  protected readonly isTyping = signal(false);
  protected readonly status = signal<string | null>(null);
  private buyerId = signal<string | null>(null);
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.ensureDemoBuyer();
    await this.loadConversations();
  }

  async loadConversations() {
    const buyerId = this.buyerId();
    if (!buyerId) {
      this.loading.set(false);
      return;
    }

    try {
      const conversations = await firstValueFrom(
        this.api.listConversations({ userId: buyerId, role: 'buyer' })
      );
      this.conversations.set(conversations);

      if (conversations.length) {
        await this.selectConversation(conversations[0].id);
      }
    } catch {
      this.status.set('Unable to load messages.');
    } finally {
      this.loading.set(false);
    }
  }

  async selectConversation(conversationId: string) {
    try {
      const conversation = await firstValueFrom(this.api.getConversation(conversationId));
      const detail = conversation as ConversationDetail;
      detail.messages = this.normalizeMessages(detail.messages ?? []);
      
      // Load the referenced post if it exists
      if (detail.postId) {
        try {
          const post = await firstValueFrom(this.api.getPost(detail.postId));
          detail.post = post as Post;
        } catch {
          console.warn('Could not load referenced post');
        }
      }
      
      this.activeConversation.set(detail);
    } catch {
      this.status.set('Unable to open conversation.');
    }
  }

  getPostMedia(post: Post | null | undefined): string {
    if (!post) return '';
    try {
      const media = Array.isArray(post.mediaUrls) 
        ? post.mediaUrls 
        : JSON.parse(post.mediaUrls as unknown as string);
      return media[0] || '';
    } catch {
      return '';
    }
  }

  async sendMessage() {
    const conversation = this.activeConversation();
    const buyerId = this.buyerId();
    if (!conversation || !buyerId || !this.messageText().trim()) {
      return;
    }

    const text = this.messageText().trim();
    this.messageText.set('');
    this.isTyping.set(false);

    const optimisticMessage: UiMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      senderId: buyerId,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
      status: 'sending',
    };

    this.activeConversation.set({
      ...conversation,
      messages: [...(conversation.messages ?? []), optimisticMessage],
    });

    try {
      await firstValueFrom(
        this.api.createMessage({
          conversationId: conversation.id,
          senderId: buyerId,
          text,
        })
      );

      await this.selectConversation(conversation.id);
    } catch {
      this.activeConversation.set({
        ...conversation,
        messages: (conversation.messages ?? []).map((message) =>
          message.id === optimisticMessage.id
            ? { ...message, status: 'error' }
            : message
        ),
      });
      this.status.set('Unable to send message.');
    }
  }

  onMessageInput(value: string) {
    this.messageText.set(value);
    this.isTyping.set(value.trim().length > 0);

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.isTyping.set(false);
    }, 900);
  }

  async retryMessage(message: UiMessage) {
    const conversation = this.activeConversation();
    const buyerId = this.buyerId();
    if (!conversation || !buyerId) {
      return;
    }

    // Mark message as sending
    this.activeConversation.set({
      ...conversation,
      messages: (conversation.messages ?? []).map((m) =>
        m.id === message.id ? { ...m, status: 'sending' } : m
      ),
    });

    try {
      await firstValueFrom(
        this.api.createMessage({
          conversationId: conversation.id,
          senderId: buyerId,
          text: message.text,
        })
      );

      // Reload conversation to sync with server state
      await this.selectConversation(conversation.id);
    } catch {
      // Mark as error again
      this.activeConversation.set({
        ...conversation,
        messages: (conversation.messages ?? []).map((m) =>
          m.id === message.id ? { ...m, status: 'error' } : m
        ),
      });
      this.status.set('Retry failed. Please try again.');
    }
  }

  getPreview(conversation: Conversation) {
    return conversation.postId ? 'Post referenced' : 'General chat';
  }

  getConversationName(conversation: Conversation) {
    return conversation.seller?.name || conversation.buyer?.name || 'Conversation';
  }

  getConversationAvatar(conversation: Conversation) {
    return (
      conversation.seller?.avatarUrl ||
      conversation.buyer?.avatarUrl ||
      'https://i.pravatar.cc/100?img=5'
    );
  }

  getLastMessage(conversation: Conversation) {
    if (conversation.messages?.length) {
      return conversation.messages[0]?.text ?? 'New conversation';
    }

    return 'New conversation';
  }

  isMine(message: Message) {
    return message.senderId === this.buyerId();
  }

  private normalizeMessages(messages: Message[]): UiMessage[] {
    return messages.map((message) => ({
      ...message,
      optimistic: false,
      status: 'sent',
    }));
  }

  private async ensureDemoBuyer() {
    const cachedId = localStorage.getItem('vibebuy_buyer_id');
    if (cachedId) {
      this.buyerId.set(cachedId);
      return;
    }

    try {
      const user = await firstValueFrom(
        this.api.createUser({
          role: 'BUYER',
          name: 'Demo Buyer'
        })
      );
      localStorage.setItem('vibebuy_buyer_id', user.id);
      this.buyerId.set(user.id);
    } catch {
      this.buyerId.set(null);
    }
  }
}
