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
    path: 'reporting',
    loadComponent: () => import('./reporting/reporting.page').then( m => m.ReportingPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'shared/:sharedConversationId',
    loadComponent: () => import('./shared-conversation/shared-conversation.page').then(m => m.SharedConversationPage)
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
  },
  {
    path: 'shared-conversation',
    loadComponent: () => import('./shared-conversation/shared-conversation.page').then( m => m.SharedConversationPage)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/callback/callback.page').then( m => m.CallbackPage)
  }
];