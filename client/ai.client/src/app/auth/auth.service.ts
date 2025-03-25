// src/app/auth/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<any>(null);
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    // Check for token on init
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.loadUserFromToken(token);
    }
    
    // Handle token from URL params (for OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      this.setToken(tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  initiateGoogleLogin(): void {
    window.location.href = `${environment.chatApiUrl}/auth/google`;
  }

  loadUserFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUser.set(payload);
      console.log(this.currentUser())
    } catch (e) {
      console.error('Invalid token', e);
      this.logout();
    }
  }
  

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.loadUserFromToken(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
}