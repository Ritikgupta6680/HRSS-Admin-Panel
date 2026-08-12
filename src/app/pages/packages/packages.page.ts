import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonMenuButton, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonSearchbar, IonSkeletonText, IonThumbnail, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Data, CreatePackageRequest, UpdatePackageRequest } from '../../services/data/data';
import { addIcons } from 'ionicons';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { addOutline, briefcaseOutline, businessOutline, cashOutline, createOutline, eyeOutline, logOutOutline, peopleOutline, pricetagOutline, searchOutline, sparklesOutline } from 'ionicons/icons';
import { PackageAddComponent } from './package-add/package-add.component';

export interface PackageModel {
  id: string;
  name: string;
  numberOfEmployees: number;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  companies: any[];
  totalCompanies: number;
}

enum ModalMode {
  None,
  Add,
  Edit,
  View,
}

@Component({
  selector: 'app-packages',
  templateUrl: './packages.page.html',
  styleUrls: ['./packages.page.scss'],
  standalone: true,
  imports: [IonContent, IonButtons, IonMenuButton, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonButton, IonSearchbar, IonFab, IonFabButton, IonModal, PackageAddComponent, IonSkeletonText, IonList, IonListHeader, IonItem, IonLabel, IonThumbnail],
})
export class PackagesPage implements OnInit {

  skeletonLoop: any[] = Array(4).fill(0);

  private readonly data = inject(Data);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading: boolean = true;

  readonly ModalMode = ModalMode;
  readonly packages = signal<PackageModel[]>([]);
  readonly searchTerm = signal('');
  readonly modalMode = signal(ModalMode.None);
  readonly selectedPackage = signal<string | null>(null);

  readonly visiblePackages = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const items = this.packages();

    if (!term) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      item.currency.toLowerCase().includes(term) ||
      item.numberOfEmployees.toString().includes(term) ||
      item.price.toString().includes(term),
    );
  });

  readonly totalPackages = computed(() => this.packages().length);
  readonly activePackages = computed(() => this.packages().filter((item) => item.isActive).length); readonly totalEmployees = computed(() =>
    this.packages()
      .filter(item => item.isActive)
      .reduce((sum, item) => sum + item.numberOfEmployees, 0)
  );

  readonly totalValue = computed(() =>
    this.packages()
      .filter(item => item.isActive)
      .reduce((sum, item) => sum + item.price, 0)
  );

  private readonly moneyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  constructor() {
    addIcons({
      addOutline,
      businessOutline,
      cashOutline,
      createOutline,
      eyeOutline,
      logOutOutline,
      peopleOutline,
      pricetagOutline,
      searchOutline,
      sparklesOutline,
      briefcaseOutline
    });
  }

  async ngOnInit() {
    this.loading = true;
    this.packages.set(await firstValueFrom(this.data.getPackages()) as PackageModel[]);
    this.loading = false;
  }

  search(term: string): void {
    this.searchTerm.set(term);
  }

  formattedPrice(item: PackageModel): string {
    return `${item.currency} ${this.moneyFormatter.format(item.price)}`;
  }

  statusLabel(item: PackageModel): string {
    return item.isActive ? 'Active' : 'Inactive';
  }

  statusState(item: PackageModel): 'active' | 'inactive' {
    return item.isActive ? 'active' : 'inactive';
  }

  openAdd(): void {
    this.selectedPackage.set(null);
    this.modalMode.set(ModalMode.Add);
  }

  openEdit(item: string): void {
    this.selectedPackage.set(item);
    this.modalMode.set(ModalMode.Edit);
  }

  openView(item: string): void {
    this.selectedPackage.set(item);
    this.modalMode.set(ModalMode.View);
  }

  closeModal(): void {
    this.modalMode.set(ModalMode.None);
    this.selectedPackage.set(null);
  }

  async handleCreate(packageItem: CreatePackageRequest): Promise<void> {
    await firstValueFrom(this.data.createPackage(packageItem));
    await this.reloadPackages();
    this.closeModal();
  }

  async handleUpdate(packageItem: UpdatePackageRequest): Promise<void> {
    await firstValueFrom(this.data.updatePackage(packageItem));
    await this.reloadPackages();
    this.closeModal();
  }

  async handleDelete(packageItem: { id: string }): Promise<void> {
    await firstValueFrom(this.data.deletePackage({
      id: packageItem.id,
    }))
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async reloadPackages(): Promise<void> {
    this.packages.set(await firstValueFrom(this.data.getPackages()) as PackageModel[]);
  }

}
