import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonProgressBar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.page.html',
  styleUrls: ['./google-callback.page.scss'],
  standalone: true,
  imports: [IonProgressBar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GoogleCallbackPage implements OnInit {
  statusMessage = 'Processing your login...';

  constructor(private router: Router) {}

  ngOnInit() {
    this.handleAuthCallback();
  }

  private handleAuthCallback() {
    try {
      // Get token from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        this.statusMessage = 'No authentication token found';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
        return;
      }

      // Store token in local storage
      localStorage.setItem('auth_token', token);
      this.statusMessage = 'Authentication successful';

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to home page
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    } catch (error) {
      console.error('Error processing auth callback', error);
      this.statusMessage = 'An error occurred during authentication';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }
}
