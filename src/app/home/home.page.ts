import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  calendarClearOutline,
  callOutline,
  cartOutline,
  logOutOutline,
  ribbonOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth/auth-service';

export type PlanType = 'Basic' | 'Standard' | 'Premium' | 'Enterprise';

export interface Company {
  id: string;
  name: string;
  /** Optional remote logo; the card falls back to an initials monogram. */
  logoUrl?: string;
  phone: string;
  planType: PlanType;
  /** ISO date — when the current plan expires. */
  validTill: string;
  /** ISO date — when the current plan was bought. */
  purchasedOn: string;
}

/** Placeholder list until the companies API is wired up. */
const MOCK_COMPANIES: Company[] = [
  {
    id: 'c-1001',
    name: 'Nimbus Technologies',
    phone: '+91 98765 43210',
    planType: 'Enterprise',
    validTill: '2027-03-31',
    purchasedOn: '2026-04-01',
  },
  {
    id: 'c-1002',
    name: 'Orbit Logistics',
    phone: '+91 91234 56780',
    planType: 'Premium',
    validTill: '2026-11-15',
    purchasedOn: '2025-11-16',
  },
  {
    id: 'c-1003',
    name: 'Vertex Healthcare',
    phone: '+91 99887 76655',
    planType: 'Standard',
    validTill: '2026-08-28',
    purchasedOn: '2025-08-29',
  },
  {
    id: 'c-1004',
    name: 'Bluepeak Retail',
    phone: '+91 90011 22334',
    planType: 'Basic',
    validTill: '2026-08-12',
    purchasedOn: '2026-02-12',
  },
  {
    id: 'c-1005',
    name: 'Ironclad Manufacturing',
    phone: '+91 93456 12098',
    planType: 'Premium',
    validTill: '2026-06-30',
    purchasedOn: '2025-07-01',
  },
  {
    id: 'c-1006',
    name: 'Larkspur Media House',
    phone: '+91 97654 32109',
    planType: 'Standard',
    validTill: '2027-01-09',
    purchasedOn: '2026-01-10',
  },
];

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
    IonSearchbar,
  ],
})
export class HomePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;

  // TODO: replace with the companies API once it exists.
  private readonly companies = signal<Company[]>(MOCK_COMPANIES);
  private readonly query = signal('');

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
      businessOutline,
      callOutline,
      ribbonOutline,
      calendarClearOutline,
      cartOutline,
      logOutOutline,
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

    if (days < 0) {
      return 'Expired';
    }

    if (days === 0) {
      return 'Expires today';
    }

    return days <= 30 ? `${days} day${days === 1 ? '' : 's'} left` : 'Active';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private daysLeft(validTill: string): number {
    const end = new Date(validTill).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    return Math.round((end - today) / 86_400_000);
  }
}
