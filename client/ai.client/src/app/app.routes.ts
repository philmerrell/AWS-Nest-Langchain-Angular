// client/ai.client/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './admin/admin.guard';

export const routes: Routes = [
  {
    path: 'c/:conversationId',
    loadComponent: () => import('./conversation/conversation.page').then( m => m.ConversationPage),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    loadComponent: () => import('./conversation/conversation.page').then( m => m.ConversationPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'google-callback',
    loadComponent: () => import('./auth/google-callback/google-callback.page').then( m => m.GoogleCallbackPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'reporting',
    loadComponent: () => import('./reporting/reporting.page').then( m => m.ReportingPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/reports',
    loadComponent: () => import('./admin/reports/reports.page').then( m => m.ReportsPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/models',
    loadComponent: () => import('./admin/models/models.page').then( m => m.ModelsPage),
    canActivate: [AuthGuard, AdminGuard]
  }
];