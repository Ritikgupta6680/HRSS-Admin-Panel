import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/angular/standalone';

import { PackageModel } from '../packages.page';
import { CreatePackageRequest, Data, UpdatePackageRequest } from '../../../services/data/data';
import { firstValueFrom } from 'rxjs';
import { AppService } from '../../../services/app/app-service';

@Component({
  selector: 'app-package-add',
  standalone: true,
  templateUrl: './package-add.component.html',
  styleUrls: ['./package-add.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle
  ]
})
export class PackageAddComponent implements OnInit {

  @Input() packageId: string | null = null;
  @Input() type: 'edit' | 'view' | 'create' = 'view';

  private data = inject(Data);
  public app = inject(AppService);

  package!: PackageModel;

  @Output() close = new EventEmitter<void>();
  @Output() savePackage = new EventEmitter<CreatePackageRequest>();
  @Output() updatePackage = new EventEmitter<UpdatePackageRequest>();
  @Output() deletePackage = new EventEmitter<{ id: string }>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    numberOfEmployees: [1, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(1)]],
    currency: ['INR', Validators.required],
    isActive: [true],
  });

  async ngOnInit() {
    console.log('Syncing form with package:', this.package);
    await this.syncForm();

    if (this.package) {
      this.form.patchValue({
        name: this.package.name,
        numberOfEmployees: this.package.numberOfEmployees,
        price: this.package.price,
        currency: this.package.currency,
        isActive: this.package.isActive,
      }, { emitEvent: false });
    } else {
      this.form.reset({
        name: '',
        numberOfEmployees: 1,
        price: 0,
        currency: 'INR',
        isActive: true,
      }, { emitEvent: false });
    }
    await this.syncForm();
  }

  save(): void {
    if (this.type === 'view') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.type === 'edit' && this.package) {
      const updatePayload: UpdatePackageRequest = {
        id: this.package.id,
        name: value.name,
        numberOfEmployees: value.numberOfEmployees,
        price: value.price,
        currency: value.currency,
        isActive: value.isActive,
      };
      this.updatePackage.emit(updatePayload);

      return;
    }

    if (this.type === 'edit' && this.package) {
      return;
    }

    const createPayload: CreatePackageRequest = {
      name: value.name,
      numberOfEmployees: value.numberOfEmployees,
      price: value.price,
      currency: value.currency,
    };

    this.savePackage.emit(createPayload);
  }

  cancel(): void {
    this.close.emit();
  }

  delete(): void {
    if (this.package) {
      const deletePayload = {
        id: this.package.id,
      };
      this.deletePackage.emit(deletePayload);
    }
  }

  private async syncForm(): Promise<void> {
    if (this.type === 'create') {
      this.package = null as unknown as PackageModel;
      this.form.enable({ emitEvent: false });
      this.form.reset({
        name: '',
        numberOfEmployees: 1,
        price: 0,
        currency: 'INR',
        isActive: true,
      }, { emitEvent: false });
      return;
    }

    if (!this.packageId) {
      return;
    }

    this.package = await firstValueFrom(this.data.getPackageById(this.packageId));

    if (this.package) {
      this.form.patchValue({
        name: this.package.name,
        numberOfEmployees: this.package.numberOfEmployees,
        price: this.package.price,
        currency: this.package.currency,
        isActive: this.package.isActive,
      }, { emitEvent: false });
    }

    if (this.type === 'view') {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
