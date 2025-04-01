// src/app/auth/auth-initializer.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthInitializerService {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  initializeAuth(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Check if we're on the callback page
      if (window.location.pathname.includes('/auth/callback')) {
        resolve(true);
        return;
      }
      
      // Check if the user is already logged in
      if (this.authService.isLoggedIn()) {
        // If they have a token, validate it by loading user info
        const token = this.authService.getToken();
        if (token) {
          this.authService.loadUserFromToken(token);
          resolve(true);
          return;
        }
      }

      // If not logged in, redirect to login page
      // Using timeout to allow the app to initialize before redirect
      setTimeout(() => {
        window.location.href = environment.loginUrl;
      }, 100);
      
      // We still resolve the promise to let the app continue initialization
      resolve(false);
    });
  }
}