import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  Company,
  CreateUserRequest,
} from '../../services/calls/call-service';

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const AADHAR_PATTERN = /^[0-9]{12}$/;
// At least one lowercase, one uppercase, one digit and one special character; no spaces.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.page.html',
  styleUrls: ['./create-user.page.scss'],
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
export class CreateUserPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CallService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  readonly roles = ['CompanyAdmin',];
  readonly genders = ['Male', 'Female', 'Other'];
  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  readonly accountTypes = ['Savings', 'Current', 'Salary'];

  readonly form = this.fb.nonNullable.group({
    // Account
    companyId: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    role: ['CompanyAdmin', [Validators.required]],

    // Personal
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    gender: ['Male', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    nationality: [''],
    bloodGroup: [''],
    maritalStatus: [''],
    profilePicture: [''],

    // Contact
    phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    workPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['', [Validators.required]],
    zipCode: ['', [Validators.required, Validators.maxLength(12)]],

    // Identity
    aadharNumber: ['', [Validators.pattern(AADHAR_PATTERN)]],
    panNumber: ['',],
    passportNumber: [''],

    // Employment
    employeeCode: [''],
    department: [''],
    designation: [''],
    dateOfJoining: ['', [Validators.required]],
    dateOfLeaving: [''],
    reportingManager: [''],
    workLocation: [''],
    workShift: [''],

    // Emergency contact
    emergencyContactName: [''],
    emergencyContactNumber: ['', [Validators.pattern(PHONE_PATTERN)]],
    emergencyContactRelation: [''],

    // Bank
    bankAccountNumber: [''],
    bankName: [''],
    bankIfscCode: [''],
    bankBranch: [''],
    bankAccountType: [''],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly companies = signal<Company[]>([]);
  readonly companiesLoading = signal(false);
  readonly companiesError = signal<string | null>(null);

  constructor() {
    addIcons({ alertCircleOutline });
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    if (this.companiesLoading()) {
      return;
    }

    this.companiesLoading.set(true);
    this.companiesError.set(null);

    this.api.get_companyies_list().subscribe({
      next: (companies) => {
        this.companiesLoading.set(false);
        this.companies.set(companies);
      },
      error: (error: ApiError) => {
        this.companiesLoading.set(false);
        this.companiesError.set(error.message ?? 'Unable to load companies.');
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

    if (control.hasError('minlength')) {
      return 'Use at least 8 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'This value is too long.';
    }

    if (control.hasError('pattern')) {
      switch (field) {
        case 'password':
          return 'Use 8+ characters with an uppercase letter, a lowercase letter, a number and a special character.';
        case 'aadharNumber':
          return 'Aadhaar must be 12 digits.';
        case 'panNumber':
          return 'Enter a valid PAN, e.g. ABCDE1234F.';
        case 'bankIfscCode':
          return 'Enter a valid IFSC code, e.g. HDFC0001234.';
        default:
          return 'Enter a valid phone number.';
      }
    }

    if (control.hasError('dateRange')) {
      return 'Leaving date must be after the joining date.';
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

    this.api.createUser(this.toRequest()).subscribe({
      next: async () => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        await this.showToast('User created successfully.', 'success');
        this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.form.enable({ emitEvent: false });
        this.errorMessage.set(error.message ?? 'Unable to create the user. Please try again.');
      },
    });
  }

  private toRequest(): CreateUserRequest {
    const value = this.form.getRawValue();

    return {
      ...value,
      dateOfBirth: this.toIsoDate(value.dateOfBirth),
      dateOfJoining: this.toIsoDate(value.dateOfJoining),
      dateOfLeaving: value.dateOfLeaving ? this.toIsoDate(value.dateOfLeaving) : null,
    };
  }

  /** 'YYYY-MM-DD' → full ISO timestamp; anything unparseable is passed through. */
  private toIsoDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  /** Flags the leaving date when it is not after the joining date. */
  private validateDateRange(): void {
    const joined = this.form.controls.dateOfJoining.value;
    const left = this.form.controls.dateOfLeaving.value;
    const leaving = this.form.controls.dateOfLeaving;

    if (joined && left && new Date(left) <= new Date(joined)) {
      leaving.setErrors({ ...(leaving.errors ?? {}), dateRange: true });
      leaving.markAsTouched();
      return;
    }

    if (leaving.hasError('dateRange')) {
      const { dateRange, ...rest } = leaving.errors ?? {};
      leaving.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toast.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }
}
