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

export interface User {
  email: string;
  name: string;
  emplId: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private tokenExpiryKey = 'token_expiry';
  
  constructor(private http: HttpClient) {}

  async exchangeCodeForTokens(code: string) {
    // Post the code to the auth/token endpoint
    const request = this.http.post<TokenResponse>(`${environment.chatApiUrl}/auth/token`, { code });
    const response = await lastValueFrom(request);

    if (!response || !response.access_token) {
      throw new Error('Invalid token response');
    }

    // Store tokens in local storage with expiry
    this.setToken(response.access_token, response.expires_in);
    
    // Store refresh token if available
    if (response.refresh_token) {
      localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    }
    
    // Load user from token
    this.loadUserFromToken(response.access_token);
    
    return response;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  loadUserFromToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check token expiry
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      if (expiryTime < Date.now()) {
        this.logout();
        return false;
      }
      
      // Extract user information
      const user: User = {
        email: payload.email || payload.preferred_username || '',
        name: payload.name || '',
        emplId: payload.oid || payload.sub || '',
        roles: payload.roles || []
      };
      
      this.currentUser.set(user);
      return true;
    } catch (e) {
      console.error('Invalid token', e);
      this.logout();
      return false;
    }
  }

  setToken(token: string, expiresIn: number = 3600): void {
    localStorage.setItem(this.tokenKey, token);
    
    // Set token expiry time
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
  }

  getToken(): string | null {
    // Check if token exists and is not expired
    const token = localStorage.getItem(this.tokenKey);
    const expiryTime = localStorage.getItem(this.tokenExpiryKey);
    
    if (!token || !expiryTime) {
      return null;
    }
    
    // If token is expired, try to refresh
    if (parseInt(expiryTime) < Date.now()) {
      this.refreshToken();
      return null; // Return null for now, the refresh process will set a new token if successful
    }
    
    return token;
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    
    if (!refreshToken) {
      this.logout();
      return false;
    }
    
    try {
      // Call refresh token endpoint
      const response = await lastValueFrom(
        this.http.post<TokenResponse>(`${environment.chatApiUrl}/auth/refresh`, { 
          refresh_token: refreshToken 
        })
      );
      
      if (response && response.access_token) {
        this.setToken(response.access_token, response.expires_in);
        
        if (response.refresh_token) {
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        }
        
        this.loadUserFromToken(response.access_token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh token', error);
      this.logout();
      return false;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    this.currentUser.set(null);
  }
}