import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { GeolocationService } from '../../core/geolocation.service';

type UploadingFile = {
  name: string;
  previewUrl: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  url?: string;
};

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly price = signal<number | null>(null);
  protected readonly category = signal('');
  protected readonly stockStatus = signal('IN_STOCK');
  protected readonly collageType = signal('1x1');
  protected readonly areaLabel = signal('');
  protected readonly uploading = signal(false);
  protected readonly status = signal<string | null>(null);
  protected readonly files = signal<UploadingFile[]>([]);

  private sellerId = signal<string | null>(localStorage.getItem('vibebuy_seller_id'));
  private sellerLat = signal<number | undefined>(undefined);
  private sellerLng = signal<number | undefined>(undefined);

  constructor(private api: ApiService, private geolocation: GeolocationService) {}

  async ngOnInit() {
    await this.captureLocation();
  }

  private async captureLocation() {
    try {
      const coords = await this.geolocation.getCurrentLocation();
      this.sellerLat.set(coords.lat);
      this.sellerLng.set(coords.lng);
      this.status.set('📍 Location captured.');
    } catch (error) {
      console.warn('Could not capture location:', error);
      // Allow posting without location
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }

    const previews = Array.from(input.files).map((file) => ({
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'idle' as const,
    }));

    this.files.set(previews);
  }

  async submit() {
    if (!this.sellerId()) {
      this.status.set('Create a seller profile first.');
      return;
    }

    if (!this.title() || this.price() == null) {
      this.status.set('Title and price are required.');
      return;
    }

    const fileInput = document.getElementById('mediaInput') as HTMLInputElement | null;
    if (!fileInput?.files?.length) {
      this.status.set('Select at least one image.');
      return;
    }

    this.uploading.set(true);
    this.status.set(null);

    try {
      const uploadedUrls: string[] = [];
      const filesArray = Array.from(fileInput.files);

      for (let index = 0; index < filesArray.length; index += 1) {
        const file = filesArray[index];
        this.updateFileStatus(file.name, 'uploading');

        const signature = await firstValueFrom(
          this.api.getUploadSignature({ folder: 'vibebuy/posts' })
        );

        const formData = new FormData();
        formData.append('file', file);
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
          this.updateFileStatus(file.name, 'error');
          throw new Error('Upload failed');
        }

        const result = await response.json();
        uploadedUrls.push(result.secure_url);
        this.updateFileStatus(file.name, 'done', result.secure_url);
      }

      await firstValueFrom(
        this.api.createPost({
          sellerId: this.sellerId() as string,
          mediaUrls: uploadedUrls,
          collageType: this.collageType(),
          title: this.title(),
          description: this.description(),
          price: this.price() as number,
          category: this.category(),
          stockStatus: this.stockStatus(),
          areaLabel: this.areaLabel(),
          lat: this.sellerLat(),
          lng: this.sellerLng(),
        })
      );

      this.status.set('Post created successfully.');
      this.resetForm();
    } catch {
      this.status.set('Unable to create post right now.');
    } finally {
      this.uploading.set(false);
    }
  }

  private resetForm() {
    this.title.set('');
    this.description.set('');
    this.price.set(null);
    this.category.set('');
    this.stockStatus.set('IN_STOCK');
    this.collageType.set('1x1');
    this.areaLabel.set('');
    this.files.set([]);
    const fileInput = document.getElementById('mediaInput') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private updateFileStatus(name: string, status: UploadingFile['status'], url?: string) {
    this.files.update((items) =>
      items.map((file) =>
        file.name === name
          ? {
              ...file,
              status,
              url: url ?? file.url,
            }
          : file
      )
    );
  }
}
