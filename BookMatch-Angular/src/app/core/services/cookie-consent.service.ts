import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { setAnalyticsCollectionEnabled } from 'firebase/analytics';

const STORAGE_KEY = 'bookmatch_cookie_consent';

export type CookieConsentStatus = 'accepted' | 'rejected' | null;

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analytics = inject(Analytics, { optional: true });

  readonly status = signal<CookieConsentStatus>(this.readStored());
  readonly shouldShowBanner = signal(this.status() === null);

  applyStoredConsent(): void {
    const stored = this.status();
    if (stored === 'accepted') {
      this.enableAnalytics(false);
      return;
    }
    this.disableAnalytics();
  }

  accept(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, 'accepted');
    this.status.set('accepted');
    this.shouldShowBanner.set(false);
    this.enableAnalytics(true);
  }

  reject(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, 'rejected');
    this.status.set('rejected');
    this.shouldShowBanner.set(false);
    this.disableAnalytics();
  }

  private readStored(): CookieConsentStatus {
    if (!isPlatformBrowser(this.platformId)) return null;
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'accepted' || value === 'rejected') return value;
    return null;
  }

  private enableAnalytics(logAppOpen: boolean): void {
    if (!this.analytics) return;
    setAnalyticsCollectionEnabled(this.analytics, true);
    if (logAppOpen) {
      logEvent(this.analytics, 'app_open', { platform: 'web' });
    }
  }

  private disableAnalytics(): void {
    if (!this.analytics) return;
    setAnalyticsCollectionEnabled(this.analytics, false);
  }
}
