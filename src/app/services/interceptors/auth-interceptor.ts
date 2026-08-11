import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from '../storage/storage-srevice';
import { AuthService } from '../auth/auth-service';

/** Endpoints that must go out without a session token. */
const PUBLIC_PATHS = ['/api/SuperAdmin/login'];

const isPublic = (url: string): boolean =>
  PUBLIC_PATHS.some((path) => url.includes(path));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const injector = inject(Injector);

  const handleUnauthorized = (error: unknown) => {
    if (
      error instanceof HttpErrorResponse &&
      error.status === 401 &&
      req.url.startsWith(environment.apiUrl) &&
      !isPublic(req.url)
    ) {
      injector.get(AuthService).logout();
    }

    return throwError(() => error);
  };

  if (
    !req.url.startsWith(environment.apiUrl) ||
    isPublic(req.url) ||
    req.headers.has('Authorization')
  ) {
    return next(req).pipe(catchError(handleUnauthorized));
  }

  const token = storage.getToken();

  if (!token) {
    return next(req).pipe(catchError(handleUnauthorized));
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  ).pipe(catchError(handleUnauthorized));
};
