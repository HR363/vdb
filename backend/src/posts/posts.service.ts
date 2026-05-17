import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(data: {
    sellerId: string;
    mediaUrls: string[] | string;
    collageType: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    stockStatus: string;
    lat?: number;
    lng?: number;
    areaLabel?: string;
  }) {
    if (!data.collageType) {
      throw new BadRequestException('Collage type is required');
    }

    const mediaUrlsArray = this.normalizeMediaUrls(data.mediaUrls);

    return this.prisma.post.create({
      data: {
        ...data,
        mediaUrls: JSON.stringify(mediaUrlsArray),
      },
    });
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.hydratePost(post, undefined, undefined);
  }

  async getFeed(params: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    stockStatus?: string;
    sellerId?: string;
    city?: string;
  }) {
    const posts = await this.prisma.post.findMany({
      where: {
        category: params.category ?? undefined,
        stockStatus: params.stockStatus ?? undefined,
        sellerId: params.sellerId ?? undefined,
        seller: params.city ? { city: params.city } : undefined,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { seller: true },
    });

    const hydrated = posts.map((post) =>
      this.hydratePost(post, params.lat, params.lng),
    );

    if (params.lat != null && params.lng != null) {
      const radius = params.radiusKm ?? 10;
      const filtered = hydrated.filter(
        (post) => post.distanceKm == null || post.distanceKm <= radius,
      );

      return filtered.sort((a, b) => {
        const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (aDistance !== bDistance) {
          return aDistance - bDistance;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return hydrated;
  }

  private hydratePost(
    post: {
      mediaUrls: string;
      lat?: number | null;
      lng?: number | null;
      createdAt: Date;
      [key: string]: any;
    },
    viewerLat?: number,
    viewerLng?: number,
  ) {
    let mediaUrls: string[] | string = post.mediaUrls;

    try {
      mediaUrls = JSON.parse(post.mediaUrls);
    } catch {
      mediaUrls = post.mediaUrls;
    }

    const distanceKm =
      viewerLat != null &&
      viewerLng != null &&
      post.lat != null &&
      post.lng != null
        ? this.getDistanceKm(viewerLat, viewerLng, post.lat, post.lng)
        : null;

    return {
      ...post,
      mediaUrls,
      distanceKm,
    };
  }

  private getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private normalizeMediaUrls(input: string[] | string) {
    let urls: string[] = [];

    if (Array.isArray(input)) {
      urls = input;
    } else if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          urls = parsed;
        } else if (input.includes(',')) {
          urls = input.split(',');
        } else {
          urls = [input];
        }
      } catch {
        urls = input.includes(',') ? input.split(',') : [input];
      }
    }

    const normalized = urls
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (normalized.length === 0) {
      throw new BadRequestException('At least one media URL is required');
    }

    const invalid = normalized.find((url) => !this.isValidMediaUrl(url));
    if (invalid) {
      throw new BadRequestException('Media URL must be http(s) or data URL');
    }

    return normalized;
  }

  private isValidMediaUrl(url: string) {
    return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
  }
}
