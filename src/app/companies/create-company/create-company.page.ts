import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

import {
  ApiError,
  CallService,
  CreateCompanyRequest,
  PlanDetails,
} from '../../services/calls/call-service';

const SLUG_PATTERN = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;
const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const URL_PATTERN = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

@Component({
  selector: 'app-create-company',
  templateUrl: './create-company.page.html',
  styleUrls: ['./create-company.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonNote,
    IonSpinner,
  ],
})
export class CreateCompanyPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CallService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastController);

  readonly currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];
  readonly timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'UTC',
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(SLUG_PATTERN)]],
    domain: ['', [Validators.required, Validators.pattern(DOMAIN_PATTERN)]],
    website: ['', [Validators.pattern(URL_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['', [Validators.required]],
    zipCode: ['', [Validators.required, Validators.maxLength(12)]],
    registrationNumber: [''],
    taxId: [''],
    industry: [''],
    timeZone: ['Asia/Kolkata', [Validators.required]],
    currency: ['INR', [Validators.required]],
    packageId: ['', [Validators.required]],
    logoUrl: ['', [Validators.pattern(URL_PATTERN)]],
    lat: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    long: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    packageStartedOn: ['', [Validators.required]],
    packageExpiresOn: ['', [Validators.required]],
  });

  /** Empty when creating; set to the company being edited otherwise. */
  readonly companyId = signal('');
  readonly isEdit = computed(() => this.companyId() !== '');

  readonly submitting = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly plans = signal<PlanDetails[]>([]);
  readonly plansLoading = signal(false);
  readonly plansError = signal<string | null>(null);

  constructor() {
    addIcons({ alertCircleOutline });

    // Keep the slug in step with the name until the user edits the slug directly.
    this.form.controls.name.valueChanges.subscribe((name) => {
      const slug = this.form.controls.slug;

      if (!slug.dirty) {
        slug.setValue(this.toSlug(name), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    // A `:id` in the route turns this page into the edit screen.
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.companyId.set(id);

    this.loadPlans();

    if (id) {
      this.loadCompany(id);
    }
  }

  /** Prefills the form with the company being edited. */
  private loadCompany(id: string): void {
    this.loading.set(true);

    this.api.get_company_details(id).subscribe({
      next: (company) => {
        this.loading.set(false);
        this.form.patchValue({
          ...company,
          packageStartedOn: this.toDateInput(company.packageStartedOn),
          packageExpiresOn: this.toDateInput(company.packageExpiresOn),
        });
        // The name is prefilled, so the slug must not be regenerated over it.
        this.form.controls.slug.markAsDirty();
      },
      error: (error: ApiError) => {
        this.loading.set(false);
        this.errorMessage.set(error.message ?? 'Unable to load this company.');
      },
    });
  }

  /** ISO timestamp → the `YYYY-MM-DD` a `type="date"` input expects. */
  private toDateInput(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  /** Fills the plan dropdown from the backend. */
  loadPlans(): void {
    if (this.plansLoading()) {
      return;
    }

    this.plansLoading.set(true);
    this.plansError.set(null);

    this.api.get_plan_Details().subscribe({
      next: (plans) => {
        this.plansLoading.set(false);
        this.plans.set(plans);

        const selected = this.form.controls.packageId.value;

        // Keep any existing choice; otherwise preselect the first plan.
        if (plans.length && !plans.some((plan) => plan.id === selected)) {
          this.form.controls.packageId.setValue(plans[0].id);
        }
      },
      error: (error: ApiError) => {
        this.plansLoading.set(false);
        this.plansError.set(error.message ?? 'Unable to load plans.');
      },
    });
  }

  /** True once the field is both invalid and has been interacted with. */
  isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  errorFor(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('maxlength')) {
      return 'This value is too long.';
    }

    if (control.hasError('min') || control.hasError('max')) {
      return field === 'lat' ? 'Latitude must be between -90 and 90.' : 'Longitude must be between -180 and 180.';
    }

    if (control.hasError('pattern')) {
      switch (field) {
        case 'slug':
          return 'Use lowercase letters, numbers, hyphens and dots only.';
        case 'domain':
          return 'Enter a valid domain, e.g. company.com.';
        case 'phone':
          return 'Enter a valid phone number.';
        default:
          return 'Enter a valid URL, e.g. company.com or https://company.com.';
      }
    }

    if (control.hasError('dateRange')) {
      return 'Expiry must be after the start date.';
    }

    return 'This value is not valid.';
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.validateDateRange();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please fix the highlighted fields.');
      return;
    }

    this.submitting.set(true);
    this.form.disable({ emitEvent: false });

    const id = this.companyId();
    const request = id
      ? this.api.updateCompany(id, this.toRequest())
      : this.api.createCompany(this.toRequest());

    request.subscribe({
      next: async () => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        await this.showToast(
          id ? 'Company updated successfully.' : 'Company created successfully.',
          'success',
        );
        this.router.navigateByUrl(id ? `/companies/${id}` : '/home', { replaceUrl: true });
      },
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        this.errorMessage.set(
          error.message ?? 'Unable to save the company. Please try again.',
        );
      },
    });
  }

  /**
   * Form values in the shape the backend expects: `date` inputs give `YYYY-MM-DD`
   * and `number` inputs hand back strings, so both are converted here.
   */
  private toRequest(): CreateCompanyRequest {
    const value = this.form.getRawValue();

    return {
      ...value,
      lat: this.toNumber(value.lat),
      long: this.toNumber(value.long),
      packageStartedOn: this.toIsoDate(value.packageStartedOn),
      packageExpiresOn: this.toIsoDate(value.packageExpiresOn),
    };
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === '' || value === undefined) {
      return null;

    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /** 'YYYY-MM-DD' → full ISO timestamp; anything unparseable is passed through. */
  private toIsoDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  /** Flags the expiry date when it is not after the start date. */
  private validateDateRange(): void {
    const start = this.form.controls.packageStartedOn.value;
    const end = this.form.controls.packageExpiresOn.value;
    const expires = this.form.controls.packageExpiresOn;

    if (start && end && new Date(end) <= new Date(start)) {
      expires.setErrors({ ...(expires.errors ?? {}), dateRange: true });
      expires.markAsTouched();
      return;
    }

    if (expires.hasError('dateRange')) {
      const { dateRange, ...rest } = expires.errors ?? {};
      expires.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toast.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }
}
