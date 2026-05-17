import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { GeolocationService } from '../../core/geolocation.service';

@Component({
  selector: 'app-seller-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-onboarding.component.html',
  styleUrl: './seller-onboarding.component.scss'
})
export class SellerOnboardingComponent implements OnInit {
  protected readonly name = signal('');
  protected readonly bio = signal('');
  protected readonly city = signal('');
  protected readonly status = signal<string | null>(null);
  protected readonly loading = signal(false);
  private sellerLat = signal<number | undefined>(undefined);
  private sellerLng = signal<number | undefined>(undefined);

  constructor(private api: ApiService, private router: Router, private geolocation: GeolocationService) {}

  ngOnInit() {
    this.captureLocation();
  }

  private async captureLocation() {
    try {
      const coords = await this.geolocation.getCurrentLocation();
      this.sellerLat.set(coords.lat);
      this.sellerLng.set(coords.lng);
    } catch (error) {
      console.warn('Could not capture location:', error);
    }
  }

  async submit() {
    this.loading.set(true);
    this.status.set(null);

    try {
      const user = await firstValueFrom(
        this.api.createUser({
          role: 'SELLER',
          name: this.name(),
          bio: this.bio(),
          city: this.city(),
          lat: this.sellerLat(),
          lng: this.sellerLng(),
        })
      );
      localStorage.setItem('vibebuy_seller_id', user.id);
      this.status.set('Seller profile ready.');
      await this.router.navigate(['/create-post']);
    } catch {
      this.status.set('Unable to create seller profile.');
    } finally {
      this.loading.set(false);
    }
  }
}
