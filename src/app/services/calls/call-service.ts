import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Error shape every caller can rely on, regardless of what the backend returned. */
export interface ApiError {
  status: number;
  message: string;
}

/** Payload sent when registering a new company. */
export interface CreateCompanyRequest {
  name: string;
  slug: string;
  domain: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  timezone: string;
  currency: string;
  plan: string;
  logoUrl: string;
  lat: number | null;
  long: number | null;
  /** ISO date — when the package starts. */
  packageStartedOn: string;
  /** ISO date — when the package expires. */
  packageExpiresOn: string;
}

export interface CreateCompanyResponse {
  id: string;
  name: string;
}

/**
 * Single entry point for backend calls: prefixes the API base URL and normalizes
 * failures into `ApiError`. The bearer token is added by `authInterceptor`.
 */
@Injectable({
  providedIn: 'root',
})
export class CallService {
  private readonly http = inject(HttpClient);


  get<T>(path: string): Observable<T> {
    return this.http
      .get<T>(this.url(path), { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(this.url(path), body, { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(this.url(path), body, { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(this.url(path), { headers: this.headers() })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createCompany(company: CreateCompanyRequest): Observable<CreateCompanyResponse> {
    return this.post<CreateCompanyResponse>('/api/SuperAdmin/add-company', company);
  }

  private url(path: string): string {
    return `${environment.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // The session token is added by `authInterceptor`, not here.
  private headers(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => this.toApiError(error));
  }

  private toApiError(error: HttpErrorResponse): ApiError {
    // status 0 means the request never reached the server (offline, CORS, DNS).
    if (error.status === 0) {
      return {
        status: 0,
        message: 'Unable to reach the server. Check your connection and try again.',
      };
    }

    const body = error.error;
    const message =
      (typeof body === 'string' && body) ||
      body?.message ||
      body?.error ||
      error.message ||
      'Something went wrong. Please try again.';

    return { status: error.status, message };
  }
}
