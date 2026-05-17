import { Injectable } from '@angular/core';

export type GeolocationCoords = {
  lat: number;
  lng: number;
};

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  async getCurrentLocation(): Promise<GeolocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted' || result.state === 'prompt';
    } catch {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  }
}
