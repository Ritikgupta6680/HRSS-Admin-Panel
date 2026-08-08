import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { StorageService } from '../storage/storage-srevice';

/** Endpoints that must go out without a session token. */
const PUBLIC_PATHS = ['/api/SuperAdmin/login'];

const isPublic = (url: string): boolean =>
  PUBLIC_PATHS.some((path) => url.includes(path));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);

  if (
    !req.url.startsWith(environment.apiUrl) ||
    isPublic(req.url) ||
    req.headers.has('Authorization')
  ) {
    return next(req);
  }

  const token = storage.getToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
