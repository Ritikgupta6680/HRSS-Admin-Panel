import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageSrevice } from '../storage/storage-srevice';

/** Error shape every caller can rely on, regardless of what the backend returned. */
export interface ApiError {
  status: number;
  message: string;
}

/**
 * Single entry point for backend calls: prefixes the API base URL, attaches the
 * bearer token when present, and normalizes failures into `ApiError`.
 */
@Injectable({
  providedIn: 'root',
})
export class CallService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageSrevice);

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

  private url(path: string): string {
    return `${environment.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.storage.getToken();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
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
