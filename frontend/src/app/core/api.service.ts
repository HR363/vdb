import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Conversation, Message, Post, UploadPlaceholder, UploadSignature, User, UserRole } from './api.types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  requestOtp(data: { channel: 'phone' | 'email'; identifier: string }) {
    return this.http.post<{ success: boolean; expiresAt: number; devCode?: string }>(
      `${this.baseUrl}/auth/request-otp`,
      data
    );
  }

  verifyOtp(data: { identifier: string; code: string; role?: UserRole; name?: string }) {
    return this.http.post<{ token: string; userId: string }>(
      `${this.baseUrl}/auth/verify-otp`,
      data
    );
  }

  listUsers(role?: UserRole) {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
  }

  getUser(id: string) {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  createUser(data: {
    role: UserRole;
    name: string;
    avatarUrl?: string;
    bio?: string;
    city?: string;
    lat?: number;
    lng?: number;
  }) {
    return this.http.post<User>(`${this.baseUrl}/users`, data);
  }

  updateUser(
    id: string,
    data: {
      name?: string;
      avatarUrl?: string;
      bio?: string;
      city?: string;
      lat?: number;
      lng?: number;
    }
  ) {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}`, data);
  }

  createPost(data: {
    sellerId: string;
    mediaUrls: string[];
    collageType: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    stockStatus: string;
    areaLabel?: string;
    lat?: number | null;
    lng?: number | null;
  }) {
    return this.http.post<Post>(`${this.baseUrl}/posts`, data);
  }

  getFeed(params?: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    stockStatus?: string;
    sellerId?: string;
    city?: string;
  }) {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<Post[]>(`${this.baseUrl}/posts`, { params: httpParams });
  }

  getPost(id: string) {
    return this.http.get<Post>(`${this.baseUrl}/posts/${id}`);
  }

  createConversation(data: { buyerId: string; sellerId: string; postId?: string }) {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations`, data);
  }

  listConversations(data: { userId: string; role: 'buyer' | 'seller' }) {
    const params = new HttpParams().set('userId', data.userId).set('role', data.role);
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`, { params });
  }

  getConversation(id: string) {
    return this.http.get<Conversation>(`${this.baseUrl}/conversations/${id}`);
  }

  createMessage(data: {
    conversationId: string;
    senderId: string;
    text: string;
    referencedPostId?: string;
    referencedMediaIndex?: number;
  }) {
    return this.http.post<Message>(`${this.baseUrl}/messages`, data);
  }

  getUploadPlaceholder() {
    return this.http.post<UploadPlaceholder>(`${this.baseUrl}/media/upload-url`, {});
  }

  getUploadSignature(data: { folder?: string; publicId?: string; tags?: string[] }) {
    return this.http.post<UploadSignature>(`${this.baseUrl}/media/upload-signature`, data);
  }
}
