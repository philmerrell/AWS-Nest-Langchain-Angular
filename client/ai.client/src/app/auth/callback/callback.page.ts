import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonProgressBar } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.page.html',
  styleUrls: ['./callback.page.scss'],
  standalone: true,
  imports: [IonProgressBar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CallbackPage implements OnInit {
  statusMessage = 'Processing your login...';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.handleAuthCallback();
  }

  private async handleAuthCallback() {
    try {
      // Get code from URL query parameters
      const queryParams = this.route.snapshot.queryParams;
      const code = queryParams['code'];

      if (!code) {
        this.statusMessage = 'Authentication error: No authorization code found';
        setTimeout(() => {
          window.open(environment.loginUrl);
        }, 2000);
        return;
      }

      await this.authService.exchangeCodeForTokens(code);

      this.statusMessage = 'Authentication successful';

      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error processing auth callback', error);
      this.statusMessage = 'An error occurred during authentication';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }
}