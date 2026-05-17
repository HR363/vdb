export type UserRole = 'SELLER' | 'BUYER';

export type User = {
  id: string;
  role: UserRole;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type Post = {
  id: string;
  sellerId: string;
  seller?: User;
  mediaUrls: string[] | string;
  collageType: string;
  title: string;
  description?: string | null;
  price: number;
  category: string;
  stockStatus: string;
  lat?: number | null;
  lng?: number | null;
  areaLabel?: string | null;
  createdAt: string;
  distanceKm?: number | null;
};

export type Conversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  postId?: string | null;
  updatedAt: string;
  buyer?: User;
  seller?: User;
  messages?: Message[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  referencedPostId?: string | null;
  referencedMediaIndex?: number | null;
  createdAt: string;
};

export type UploadPlaceholder = {
  uploadUrl: string;
  publicUrl: string;
  method: string;
  headers: Record<string, string>;
};

export type UploadSignature = {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
  publicId?: string;
  tags: string[];
};
