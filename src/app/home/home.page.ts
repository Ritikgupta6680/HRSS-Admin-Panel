import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  businessOutline,
  calendarClearOutline,
  callOutline,
  cartOutline,
  logOutOutline,
  personAddOutline,
  ribbonOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth/auth-service';
import { ApiError, CallService, Company } from '../services/calls/call-service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonSearchbar,
    IonSkeletonText,
  ],
})
export class HomePage implements ViewWillEnter {
  private readonly auth = inject(AuthService);
  private readonly api = inject(CallService);
  private readonly router = inject(Router)

  readonly user = this.auth.user;

  private readonly companies = signal<Company[]>([]);
  private readonly query = signal('');

  /** Placeholder cards shown while the list loads. */
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalCompanies = computed(() => this.companies().length);

  readonly visibleCompanies = computed(() => {
    const term = this.query().trim().toLowerCase();

    if (!term) {
      return this.companies();
    }

    return this.companies().filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        company.phone.toLowerCase().includes(term) ||
        company.planType.toLowerCase().includes(term),
    );
  });

  constructor() {
    addIcons({
      alertCircleOutline,
      businessOutline,
      callOutline,
      ribbonOutline,
      calendarClearOutline,
      cartOutline,
      logOutOutline,
      personAddOutline,
    });
  }

  /**
   * Ionic keeps this page alive in the nav stack, so `ngOnInit` runs only once.
   * Reloading on every entry keeps the list fresh after a company is created or edited.
   */
  ionViewWillEnter(): void {
    this.loadCompanies();
  }

  /** Fills the card grid from the backend. */
  loadCompanies(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.get_companyies_list().subscribe({
      next: (companies) => {
        this.loading.set(false);
        this.companies.set(companies);
      },
      error: (error: ApiError) => {
        this.loading.set(false);
        this.companies.set([]);
        this.errorMessage.set(error.message ?? 'Unable to load companies.');
      },
    });
  }

  search(term: string): void {
    this.query.set(term);
  }

  /** Up to two letters taken from the company name, used when there is no logo. */
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  /** 'expired' | 'expiring' (within 30 days) | 'active' — drives the badge colour. */
  expiryState(validTill: string): 'expired' | 'expiring' | 'active' {
    const days = this.daysLeft(validTill);

    if (days < 0) {
      return 'expired';
    }

    return days <= 30 ? 'expiring' : 'active';
  }

  expiryLabel(validTill: string): string {
    const days = this.daysLeft(validTill);

    // The backend may omit the date entirely.
    if (Number.isNaN(days)) {
      return '—';
    }

    if (days < 0) {
      return 'Expired';
    }

    if (days === 0) {
      return 'Expires today';
    }

    return days <= 30 ? `${days} day${days === 1 ? '' : 's'} left` : 'Active';
  }

  createCompany(): void {
    this.router.navigateByUrl('/companies/new');
  }

  openCompany(company: Company): void {
    this.router.navigate(['/companies', company.id]);
  }

  createUser(): void {
    this.router.navigateByUrl('/users/new');
  }

  logout(): void {
    this.auth.logout();

  }

  private daysLeft(validTill: string): number {
    const end = new Date(validTill).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    return Math.round((end - today) / 86_400_000);
  }
}
