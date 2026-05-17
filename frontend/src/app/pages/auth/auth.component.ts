import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  protected readonly channel = signal<'phone' | 'email'>('email');
  protected readonly identifier = signal('');
  protected readonly code = signal('');
  protected readonly role = signal<'SELLER' | 'BUYER'>('BUYER');
  protected readonly name = signal('');
  protected readonly step = signal<'request' | 'verify'>('request');
  protected readonly status = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly devCode = signal<string | null>(null);

  constructor(private api: ApiService, private router: Router) {}

  async requestOtp() {
    this.loading.set(true);
    this.status.set(null);
    this.devCode.set(null);

    try {
      const response = await firstValueFrom(
        this.api.requestOtp({
          channel: this.channel(),
          identifier: this.identifier(),
        })
      );
      this.devCode.set(response.devCode ?? null);
      this.step.set('verify');
    } catch {
      this.status.set('Unable to request OTP.');
    } finally {
      this.loading.set(false);
    }
  }

  async verifyOtp() {
    this.loading.set(true);
    this.status.set(null);

    try {
      const response = await firstValueFrom(
        this.api.verifyOtp({
          identifier: this.identifier(),
          code: this.code(),
          role: this.role(),
          name: this.name() || undefined,
        })
      );
      localStorage.setItem('vibebuy_token', response.token);
      localStorage.setItem('vibebuy_user_id', response.userId);

      if (this.role() === 'SELLER') {
        localStorage.setItem('vibebuy_seller_id', response.userId);
      } else {
        localStorage.setItem('vibebuy_buyer_id', response.userId);
      }

      await this.router.navigate(['/']);
    } catch {
      this.status.set('Invalid OTP or expired.');
    } finally {
      this.loading.set(false);
    }
  }

  reset() {
    this.step.set('request');
    this.code.set('');
    this.status.set(null);
  }
}
