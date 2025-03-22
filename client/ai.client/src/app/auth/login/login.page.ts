// src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login to BoiseState.ai</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="login-container">
        <h2>Welcome to BoiseState.ai</h2>
        <p>Please sign in to access the AI chat application</p>
        <ion-button expand="block" color="primary" (click)="loginWithGoogle()">
          Sign in with Google
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }
  `],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton]
})
export class LoginPage {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  loginWithGoogle(): void {
    this.authService.initiateGoogleLogin();
  }
}