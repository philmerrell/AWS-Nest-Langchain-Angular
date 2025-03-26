import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'c/:conversationId',
    loadComponent: () => import('./conversation/conversation.page').then( m => m.ConversationPage),
    canActivate: []
  },

  {
    path: '',
    loadComponent: () => import('./conversation/conversation.page').then( m => m.ConversationPage),
    canActivate: []
  },


  // {
  //   path: '**',
  //   redirectTo: ''
  // },
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
    loadComponent: () => import('./reporting/reporting.page').then( m => m.ReportingPage)
  },
  {
    path: 'admin/reports',
    loadComponent: () => import('./admin/reports/reports.page').then( m => m.ReportsPage)
  },
  {
    path: 'admin/models',
    loadComponent: () => import('./admin/models/models.page').then( m => m.ModelsPage)
  }
];
