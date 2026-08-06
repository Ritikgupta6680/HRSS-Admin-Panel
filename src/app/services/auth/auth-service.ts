import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { CallService } from '../calls/call-service';
import { StorageService } from '../storage/storage-srevice';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(CallService);
  private readonly storage = inject(StorageService);

  // Seeded from storage so a page refresh keeps the user signed in.
  private readonly token = signal<string | null>(this.storage.getToken());
  private readonly currentUser = signal<AuthUser | null>(this.storage.getUser<AuthUser>());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/api/SuperAdmin/login', credentials).pipe(
      tap((response) => this.startSession(response)),
    );
  }

  logout(): void {
    this.storage.clear();
    this.token.set(null);
    this.currentUser.set(null);
  }

  private startSession(response: LoginResponse): void {
    this.storage.setToken(response.token);
    this.storage.setUser(response.user);
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }
}
