import { Injectable } from '@angular/core';

const TOKEN_KEY = 'hrss.token';
const USER_KEY = 'hrss.user';

/**
 * Thin wrapper over localStorage so the rest of the app never touches the
 * storage API directly. Every read is defensive: a webview with storage
 * disabled, or a corrupted value, must not break bootstrap.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageSrevice {
  getToken(): string | null {
    return this.read(TOKEN_KEY);
  }

  setToken(token: string): void {
    this.write(TOKEN_KEY, token);
  }

  getUser<T>(): T | null {
    const raw = this.read(USER_KEY);
    if (!raw) {
      return null;
    }

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
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode / quota) — session stays in memory only.
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to do.
    }
  }
}
