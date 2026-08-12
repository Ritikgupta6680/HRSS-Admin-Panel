import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },

  {
    path: 'companies/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./companies/create-company/create-company.page').then((m) => m.CreateCompanyPage),
  },
  // Must stay after `companies/new` so the literal path wins over `:id`.
  {
    path: 'companies/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./companies/company-detail/company-detail.page').then((m) => m.CompanyDetailPage),
  },
  {
    path: 'companies/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./companies/create-company/create-company.page').then((m) => m.CreateCompanyPage),
  },
  {
    path: 'users/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/create-user/create-user.page').then((m) => m.CreateUserPage),
  },
  {
    path: 'users/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/create-user/create-user.page').then((m) => m.CreateUserPage),
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
