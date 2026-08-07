import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'packages',
    loadComponent: () => import('./pages/packages/packages.page').then(m => m.PackagesPage)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },

];
