import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { User } from '../../core/api.types';

type UploadState = {
  name: string;
  previewUrl: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
};

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-profile.component.html',
  styleUrl: './seller-profile.component.scss'
})
export class SellerProfileComponent implements OnInit {
  protected readonly seller = signal<User | null>(null);
  protected readonly name = signal('');
  protected readonly bio = signal('');
  protected readonly city = signal('');
  protected readonly avatarUrl = signal('');
  protected readonly status = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly uploadState = signal<UploadState | null>(null);
  protected readonly cropEnabled = signal(true);
  protected readonly cropPreviewUrl = signal<string | null>(null);
  protected readonly cropScale = signal(1);
  protected readonly cropOffsetX = signal(0);
  protected readonly cropOffsetY = signal(0);
  protected readonly cropLeft = signal(0.15);
  protected readonly cropTop = signal(0.15);
  protected readonly cropRight = signal(0.85);
  protected readonly cropBottom = signal(0.85);
  private lastAvatarFile = signal<File | null>(null);
  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;
  private dragHandle: string | null = null;
  private dragStartLeft = 0;
  private dragStartTop = 0;
  private dragStartRight = 0;
  private dragStartBottom = 0;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    const sellerId = localStorage.getItem('vibebuy_seller_id');
    if (!sellerId) {
      this.status.set('No seller profile yet.');
      this.loading.set(false);
      return;
    }

    try {
      const seller = await firstValueFrom(this.api.getUser(sellerId));
      this.seller.set(seller);
      this.name.set(seller.name);
      this.bio.set(seller.bio ?? '');
      this.city.set(seller.city ?? '');
      this.avatarUrl.set(seller.avatarUrl ?? '');
    } catch {
      this.status.set('Unable to load seller profile.');
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    const seller = this.seller();
    if (!seller) {
      return;
    }

    this.status.set(null);

    try {
      const updated = await firstValueFrom(
        this.api.updateUser(seller.id, {
          name: this.name(),
          bio: this.bio(),
          city: this.city(),
          avatarUrl: this.avatarUrl(),
        })
      );
      this.seller.set(updated);
      this.status.set('Profile updated.');
    } catch {
      this.status.set('Unable to update profile.');
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    this.cropPreviewUrl.set(URL.createObjectURL(file));
    this.cropScale.set(1);
    this.cropOffsetX.set(0);
    this.cropOffsetY.set(0);
    this.cropLeft.set(0.15);
    this.cropTop.set(0.15);
    this.cropRight.set(0.85);
    this.cropBottom.set(0.85);
    this.lastAvatarFile.set(file);
    await this.uploadAvatar(file);
  }

  async retryAvatarUpload() {
    const file = this.lastAvatarFile();
    if (!file) {
      return;
    }

    await this.uploadAvatar(file);
  }

  private async uploadAvatar(file: File) {
    this.status.set(null);
    const prepared = await this.prepareAvatarFile(file);
    this.uploadState.set({
      name: file.name,
      previewUrl: URL.createObjectURL(prepared),
      status: 'uploading',
    });

    try {
      const signature = await firstValueFrom(
        this.api.getUploadSignature({ folder: 'vibebuy/avatars' })
      );

      const formData = new FormData();
      formData.append('file', prepared);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);
      if (signature.folder) {
        formData.append('folder', signature.folder);
      }

      const response = await fetch(signature.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      this.avatarUrl.set(result.secure_url);
      this.uploadState.set({
        name: file.name,
        previewUrl: result.secure_url,
        status: 'done',
      });
    } catch {
      this.uploadState.set({
        name: file.name,
        previewUrl: this.uploadState()?.previewUrl ?? '',
        status: 'error',
      });
      this.status.set('Unable to upload avatar.');
    }
  }

  private async prepareAvatarFile(file: File) {
    if (!this.cropEnabled()) {
      return file;
    }

    const image = await createImageBitmap(file);
    const scale = this.cropScale();
    
    // Calculate the source crop area based on the visual crop box
    const cropWidth = (this.cropRight() - this.cropLeft()) * image.width;
    const cropHeight = (this.cropBottom() - this.cropTop()) * image.height;
    const cropSize = Math.min(cropWidth, cropHeight);
    
    // Calculate the pan offset effect
    const baseSize = Math.min(image.width, image.height) / scale;
    const maxX = Math.max(0, (image.width - baseSize) / 2);
    const maxY = Math.max(0, (image.height - baseSize) / 2);
    const offsetX = this.cropOffsetX() * maxX;
    const offsetY = this.cropOffsetY() * maxY;
    
    // Combine crop area selection with zoom/pan offset
    const sx = this.clamp(
      (this.cropLeft() * image.width) + offsetX,
      0,
      image.width - cropSize
    );
    const sy = this.clamp(
      (this.cropTop() * image.height) + offsetY,
      0,
      image.height - cropSize
    );
    
    const canvas = document.createElement('canvas');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    );

    if (!blob) {
      return file;
    }

    return new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
      type: blob.type,
    });
  }

  onCropPointerDown(event: PointerEvent) {
    if (!this.cropEnabled()) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    // Check if clicking on a handle
    const handleClass = (event.target as HTMLElement).className;
    if (handleClass?.includes('crop-handle')) {
      this.dragHandle = (event.target as HTMLElement).dataset['handle'] || null;
      if (this.dragHandle) {
        this.dragActive = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartLeft = this.cropLeft();
        this.dragStartTop = this.cropTop();
        this.dragStartRight = this.cropRight();
        this.dragStartBottom = this.cropBottom();
        target.setPointerCapture(event.pointerId);
        return;
      }
    }

    // Otherwise, drag the image preview (old behavior)
    this.dragActive = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartOffsetX = this.cropOffsetX();
    this.dragStartOffsetY = this.cropOffsetY();
    target.setPointerCapture(event.pointerId);
  }

  onCropPointerMove(event: PointerEvent) {
    if (!this.dragActive) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const deltaX = (event.clientX - this.dragStartX) / rect.width;
    const deltaY = (event.clientY - this.dragStartY) / rect.height;

    if (this.dragHandle) {
      // Handle drag logic for crop box
      const minSize = 0.2; // Minimum 20% of image
      const maxSize = 0.8; // Maximum 80% of image
      const minDistance = 0.1; // Minimum 10% distance between handles

      switch (this.dragHandle) {
        case 'nw':
          this.cropLeft.set(this.clamp(this.dragStartLeft + deltaX, 0, this.dragStartRight - minDistance));
          this.cropTop.set(this.clamp(this.dragStartTop + deltaY, 0, this.dragStartBottom - minDistance));
          break;
        case 'n':
          this.cropTop.set(this.clamp(this.dragStartTop + deltaY, 0, this.dragStartBottom - minDistance));
          break;
        case 'ne':
          this.cropRight.set(this.clamp(this.dragStartRight + deltaX, this.dragStartLeft + minDistance, 1));
          this.cropTop.set(this.clamp(this.dragStartTop + deltaY, 0, this.dragStartBottom - minDistance));
          break;
        case 'w':
          this.cropLeft.set(this.clamp(this.dragStartLeft + deltaX, 0, this.dragStartRight - minDistance));
          break;
        case 'e':
          this.cropRight.set(this.clamp(this.dragStartRight + deltaX, this.dragStartLeft + minDistance, 1));
          break;
        case 'sw':
          this.cropLeft.set(this.clamp(this.dragStartLeft + deltaX, 0, this.dragStartRight - minDistance));
          this.cropBottom.set(this.clamp(this.dragStartBottom + deltaY, this.dragStartTop + minDistance, 1));
          break;
        case 's':
          this.cropBottom.set(this.clamp(this.dragStartBottom + deltaY, this.dragStartTop + minDistance, 1));
          break;
        case 'se':
          this.cropRight.set(this.clamp(this.dragStartRight + deltaX, this.dragStartLeft + minDistance, 1));
          this.cropBottom.set(this.clamp(this.dragStartBottom + deltaY, this.dragStartTop + minDistance, 1));
          break;
      }
    } else {
      // Image pan/drag logic (old behavior)
      this.cropOffsetX.set(this.clamp(this.dragStartOffsetX + deltaX * 2, -1, 1));
      this.cropOffsetY.set(this.clamp(this.dragStartOffsetY + deltaY * 2, -1, 1));
    }
  }

  onCropPointerUp(event: PointerEvent) {
    if (!this.dragActive) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (target) {
      target.releasePointerCapture(event.pointerId);
    }
    this.dragActive = false;
    this.dragHandle = null;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}
