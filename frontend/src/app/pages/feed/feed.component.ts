import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { GeolocationService } from '../../core/geolocation.service';
import { Post } from '../../core/api.types';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit {
  protected readonly posts = signal<Post[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly carouselIndex = signal<Record<string, number>>({});
  protected readonly radiusKm = signal(25); // Default 25km radius
  private buyerId = signal<string | null>(null);
  private buyerLat = signal<number | undefined>(undefined);
  private buyerLng = signal<number | undefined>(undefined);
  private mediaCache = new Map<string, string[]>();
  private swipeStartX: number | null = null;
  private swipeStartY: number | null = null;
  private readonly SWIPE_THRESHOLD = 50; // pixels

  constructor(private api: ApiService, private geolocation: GeolocationService) {}

  async ngOnInit() {
    await this.ensureDemoBuyer();
    await this.captureLocation();
    await this.loadFeed();
  }

  private async captureLocation() {
    try {
      const coords = await this.geolocation.getCurrentLocation();
      this.buyerLat.set(coords.lat);
      this.buyerLng.set(coords.lng);
    } catch (error) {
      console.warn('Could not capture location:', error);
      // Allow browsing without location, but posts won't have distance info
    }
  }

  async loadFeed() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const posts = await firstValueFrom(
        this.api.getFeed({
          lat: this.buyerLat(),
          lng: this.buyerLng(),
          radiusKm: this.radiusKm(),
        } as any)
      );
      this.posts.set(posts);
    } catch {
      this.error.set('Unable to load feed yet.');
      this.posts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  setRadius(radius: number) {
    this.radiusKm.set(radius);
    this.loadFeed();
  }

  async startConversation(post: Post) {
    const buyerId = this.buyerId();
    const sellerId = post.sellerId ?? post.seller?.id;

    if (!buyerId || !sellerId) {
      this.statusMessage.set('Please sign in before messaging.');
      return;
    }

    try {
      const conversation = await firstValueFrom(
        this.api.createConversation({
          buyerId,
          sellerId,
          postId: post.id,
        })
      );

      await firstValueFrom(
        this.api.createMessage({
          conversationId: conversation.id,
          senderId: buyerId,
          text: 'Is this available?'
        })
      );

      this.statusMessage.set('Message sent.');
    } catch {
      this.statusMessage.set('Unable to start chat right now.');
    }
  }

  getPrimaryMedia(post: Post) {
    return this.getMediaList(post)[0] ?? '';
  }

  getMediaList(post: Post) {
    if (this.mediaCache.has(post.id)) {
      return this.mediaCache.get(post.id) ?? [];
    }

    const media = post.mediaUrls;
    let list: string[] = [];

    if (Array.isArray(media)) {
      list = media;
    } else if (typeof media === 'string') {
      try {
        const parsed = JSON.parse(media);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else {
          list = [media];
        }
      } catch {
        list = [media];
      }
    }

    this.mediaCache.set(post.id, list);
    return list;
  }

  getCurrentMedia(post: Post) {
    const list = this.getMediaList(post);
    const index = this.carouselIndex()[post.id] ?? 0;
    return list[index] ?? list[0] ?? '';
  }

  getCurrentIndex(post: Post) {
    return this.carouselIndex()[post.id] ?? 0;
  }

  setCarouselIndex(post: Post, index: number) {
    this.carouselIndex.update((state) => ({
      ...state,
      [post.id]: index,
    }));
  }

  nextMedia(post: Post) {
    const list = this.getMediaList(post);
    if (list.length <= 1) {
      return;
    }

    const nextIndex = (this.getCurrentIndex(post) + 1) % list.length;
    this.setCarouselIndex(post, nextIndex);
  }

  previousMedia(post: Post) {
    const list = this.getMediaList(post);
    if (list.length <= 1) {
      return;
    }

    const current = this.getCurrentIndex(post);
    const nextIndex = (current - 1 + list.length) % list.length;
    this.setCarouselIndex(post, nextIndex);
  }

  onCarouselTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.swipeStartX = touch.clientX;
    this.swipeStartY = touch.clientY;
  }

  onCarouselTouchEnd(event: TouchEvent, post: Post) {
    if (this.swipeStartX === null || this.swipeStartY === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.swipeStartX;
    const deltaY = touch.clientY - this.swipeStartY;

    // Only trigger swipe if primarily horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swiped right, go to previous image
        this.previousMedia(post);
      } else {
        // Swiped left, go to next image
        this.nextMedia(post);
      }
    }

    // Reset swipe tracking
    this.swipeStartX = null;
    this.swipeStartY = null;
  }

  formatDistance(distanceKm?: number | null) {
    if (distanceKm == null) {
      return 'Nearby';
    }

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m away`;
    }

    return `${distanceKm.toFixed(1)} km away`;
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
