import { inject, Injectable } from '@angular/core';
import { CallService } from '../calls/call-service';
import { PackageModel } from '../../pages/packages/packages.page';

export interface CreatePackageRequest {
  name: string;
  numberOfEmployees: number;
  price: number;
  currency: string;
}

export interface UpdatePackageRequest {
  id: string;
  name: string;
  numberOfEmployees: number;
  price: number;
  currency: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Data {

  private readonly callService = inject(CallService);

  getPackages() {
    return this.callService.get<PackageModel[]>('/api/SuperAdmin/packages');
  }

  getPackageById(id: string) {
    return this.callService.get<PackageModel>(`/api/SuperAdmin/package/${id}`);
  }

  createPackage(payload: CreatePackageRequest) {
    return this.callService.post('/api/SuperAdmin/create-package', payload);
  }

  updatePackage(payload: UpdatePackageRequest) {
    return this.callService.post('/api/SuperAdmin/update-package', payload);
  }

  deletePackage(payload: { id: string }) {
    return this.callService.post(`/api/SuperAdmin/delete-package`, payload);
  }

}
