// client/ai.client/src/app/admin/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser()();
    
    if (user && user.roles && user.roles.includes('DotNetDevelopers')) {
      return true;
    }
    
    // User doesn't have admin role
    this.showAccessDeniedToast();
    this.router.navigate(['/']);
    return false;
  }

  private async showAccessDeniedToast() {
    const toast = await this.toastController.create({
      message: 'Access denied. Administrator privileges required.',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
}