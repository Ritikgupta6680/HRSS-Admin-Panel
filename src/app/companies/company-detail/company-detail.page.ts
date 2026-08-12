import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  callOutline,
  createOutline,
  mailOutline,
  trashOutline,
  peopleOutline,
} from 'ionicons/icons';

import {
  ApiError,
  CallService,
  CompanyDetails,
  CompanyUser,
} from '../../services/calls/call-service';

/** One label/value pair rendered in a details section. */
interface DetailRow {
  label: string;
  value: string;
  /** Rendered as a link when set. */
  href?: string;
}

interface DetailSection {
  title: string;
  rows: DetailRow[];
}

@Component({
  selector: 'app-company-detail',
  templateUrl: './company-detail.page.html',
  styleUrls: ['./company-detail.page.scss'],
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class CompanyDetailPage implements ViewWillEnter {
  private readonly api = inject(CallService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertController);
  private readonly toast = inject(ToastController);

  private readonly companyId = signal('');

  readonly company = signal<CompanyDetails | null>(null);
  readonly companyLoading = signal(false);
  readonly companyError = signal<string | null>(null);

  readonly deleting = signal(false);

  readonly users = signal<CompanyUser[]>([]);
  /** Id of the user currently being deleted, so only that row shows progress. */
  readonly deletingUserId = signal<string | null>(null);
  readonly usersLoading = signal(false);
  readonly usersError = signal<string | null>(null);

  /** The company's fields grouped into the cards shown on the page. */
  readonly sections = computed<DetailSection[]>(() => {
    const company = this.company();

    if (!company) {
      return [];
    }

    return [
      {
        title: 'Company details',
        rows: [
          { label: 'Slug', value: company.slug },
          { label: 'Domain', value: company.domain },
          { label: 'Website', value: company.website, href: this.toHref(company.website) },
          { label: 'Industry', value: company.industry },
        ],
      },
      {
        title: 'Contact',
        rows: [
          { label: 'Email', value: company.email, href: `mailto:${company.email}` },
          { label: 'Phone', value: company.phone, href: `tel:${company.phone}` },
          { label: 'Address', value: company.address },
          { label: 'City', value: company.city },
          { label: 'State', value: company.state },
          { label: 'Country', value: company.country },
          { label: 'Zip code', value: company.zipCode },
          { label: 'Coordinates', value: this.toCoordinates(company) },
        ],
      },
      {
        title: 'Legal & localisation',
        rows: [
          { label: 'Registration number', value: company.registrationNumber },
          { label: 'Tax ID', value: company.taxId },
          { label: 'Timezone', value: company.timeZone },
          { label: 'Currency', value: company.currency },
        ],
      },
    ];
  });

  constructor() {
    addIcons({
      alertCircleOutline,
      callOutline,
      createOutline,
      mailOutline,
      peopleOutline,
      trashOutline,
    });
  }

  /** Runs on every entry, so returning from the edit screen shows fresh data. */
  ionViewWillEnter(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.companyId.set(id);

    if (!id) {
      this.companyError.set('No company was specified.');
      return;
    }

    this.loadCompany();
    this.loadUsers();
  }

  loadCompany(): void {
    if (this.companyLoading()) {
      return;
    }

    this.companyLoading.set(true);
    this.companyError.set(null);

    this.api.get_company_details(this.companyId()).subscribe({
      next: (company) => {
        this.companyLoading.set(false);
        this.company.set(company);
      },
      error: (error: ApiError) => {
        this.companyLoading.set(false);
        this.companyError.set(error.message ?? 'Unable to load this company.');
      },
    });
  }

  loadUsers(): void {
    if (this.usersLoading()) {
      return;
    }

    this.usersLoading.set(true);
    this.usersError.set(null);

    this.api.get_company_users(this.companyId()).subscribe({
      next: (users) => {
        this.usersLoading.set(false);
        this.users.set(users);
      },
      error: (error: ApiError) => {
        this.usersLoading.set(false);
        this.usersError.set(error.message ?? 'Unable to load users.');
      },
    });
  }

  editCompany(): void {
    this.router.navigate(['/companies', this.companyId(), 'edit']);
  }

  /** Asks first — deleting a company cannot be undone from here. */
  async deleteCompany(): Promise<void> {
    const company = this.company();

    if (!company || this.deleting()) {
      return;
    }

    const alert = await this.alert.create({
      header: 'Delete company?',
      message: `“${company.name}” and its data will be removed. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'destructive') {
      return;
    }

    this.deleting.set(true);

    this.api.deleteCompany(this.companyId()).subscribe({
      next: async () => {
        this.deleting.set(false);
        await this.showToast('Company deleted.', 'success');
        this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: async (error: ApiError) => {
        this.deleting.set(false);
        await this.showToast(error.message ?? 'Unable to delete this company.', 'danger');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toast.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }

  editUser(user: CompanyUser): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  /** Asks first, then drops the row locally so the list updates immediately. */
  async deleteUser(user: CompanyUser): Promise<void> {
    if (this.deletingUserId()) {
      return;
    }

    const alert = await this.alert.create({
      header: 'Delete user?',
      message: `“${this.fullName(user)}” will be removed. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'destructive') {
      return;
    }

    this.deletingUserId.set(user.id);

    this.api.deleteUser(user.id).subscribe({
      next: async () => {
        this.deletingUserId.set(null);
        this.users.update((users) => users.filter((row) => row.id !== user.id));
        await this.showToast('User deleted.', 'success');
      },
      error: async (error: ApiError) => {
        this.deletingUserId.set(null);
        await this.showToast(error.message ?? 'Unable to delete this user.', 'danger');
      },
    });
  }

  addUser(): void {
    this.router.navigate(['/users/new'], { queryParams: { companyId: this.companyId() } });
  }

  fullName(user: CompanyUser): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  /** Up to two letters taken from the name, used when there is no picture. */
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  private toCoordinates(company: CompanyDetails): string {
    return company.lat === null || company.long === null ? '' : `${company.lat}, ${company.long}`;
  }

  private toHref(website: string): string | undefined {
    if (!website) {
      return undefined;
    }

    return /^https?:\/\//i.test(website) ? website : `https://${website}`;
  }
}
