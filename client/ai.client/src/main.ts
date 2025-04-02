// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { MERMAID_OPTIONS, provideMarkdown } from 'ngx-markdown';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/auth/auth.interceptor';
import { AuthInitializerService } from './app/auth/auth-initializer.service';

// Initialize auth service function
function initializeApp(authInitService: AuthInitializerService) {
  return () => authInitService.initializeAuth();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      swipeBackEnabled: false
    }),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideMarkdown({
      mermaidOptions: {
        provide: MERMAID_OPTIONS,
        useValue: {
          darkMode: true
        },
      },
    }),
    
    // Add initializer as a provider that runs before the app starts
    {
      provide: 'INIT_APP',
      useFactory: initializeApp,
      deps: [AuthInitializerService],
      multi: true
    }
  ],
});