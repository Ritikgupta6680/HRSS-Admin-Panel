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
    return this.callService.get<PackageModel>(`/api/SuperAdmin/packages/${id}`);
  }

  createPackage(payload: CreatePackageRequest) {
    return this.callService.post('/api/SuperAdmin/packages', payload);
  }

  updatePackage(payload: UpdatePackageRequest) {
    return this.callService.put(`/api/SuperAdmin/packages/${payload.id}`, payload);
  }

  deletePackage(payload: { id: string }) {
    return this.callService.delete(`/api/SuperAdmin/packages/${payload.id}`);
  }

}
