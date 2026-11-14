import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

const TOKEN_KEY = 'hrss.token';
const USER_KEY = 'hrss.user';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private cookieService: CookieService) { }

  getToken(): string | null {
    return this.read(TOKEN_KEY);
  }

  setToken(token: string): void {
    this.write(TOKEN_KEY, token);
  }

  getUser<T>(): T | null {
    const raw = this.read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.remove(USER_KEY);
      return null;
    }
  }

  setUser(user: unknown): void {
    this.write(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    this.remove(TOKEN_KEY);
    this.remove(USER_KEY);
  }

  private read(key: string): string | null {
    try {
      if (this.cookieService.check(key)) {
        const val = this.cookieService.get(key);
        if (val) return val;
      }
    } catch { }

    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch { }

    return null;
  }

  private write(key: string, value: string): void {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    try {
      this.cookieService.set(
        key,
        value,
        7,
        '/',
        undefined,
        isHttps,
        'Lax'
      );
    } catch { }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch { }
  }

  private remove(key: string): void {
    try {
      this.cookieService.delete(key, '/');
    } catch { }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch { }
  }
}
