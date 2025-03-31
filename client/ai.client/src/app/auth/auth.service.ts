import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

interface TokenResponse {
  "token_type": string;
  "scope": string;
  "expires_in": number;
  "ext_expires_in": number;
  "access_token": string;
  "refresh_token": string;
  "id_token": string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<any>(null);
  private tokenKey = 'access_token';

  constructor(private http: HttpClient) {
    // Check for token on init
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  async exchangeCodeForTokens(code: string) {
    // Post the code to the auth/token endpoint
    const request = this.http.post<TokenResponse>(`${environment.chatApiUrl}/auth/token`, { code });
    const response = await lastValueFrom(request);

    if (!response || !response.access_token) {
      throw new Error('Invalid token response');
    }

    // Store tokens in local storage
    localStorage.setItem('access_token', response.access_token);
    
    // Store refresh token if available
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    
    // Store ID token if available
    if (response.id_token) {
      localStorage.setItem('id_token', response.id_token);
    }
  }

  getCurrentUser() {
    return this.currentUser
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