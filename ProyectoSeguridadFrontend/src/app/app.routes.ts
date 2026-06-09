import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'messenger',
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent,
          ),
      },
      {
        path: 'recuperar-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password-page/forgot-password-page.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
      },
      {
        path: 'restablecer-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password-page/reset-password-page.component').then(
            (m) => m.ResetPasswordPageComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },
  {
    path: 'messenger',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/messenger-layout/messenger-layout.component').then(
        (m) => m.MessengerLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/chats/pages/messenger-page/messenger-page.component').then(
            (m) => m.MessengerPageComponent,
          ),
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/users/pages/user-settings-page/user-settings-page.component').then(
            (m) => m.UserSettingsPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
