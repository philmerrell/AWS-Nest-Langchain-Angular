// client/ai.client/src/app/core/user-menu/user-menu.component.ts
import { CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonItem, IonItemDivider, IonLabel, IonText, PopoverController, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  barChartOutline, 
  lockClosedOutline, 
  logOutOutline, 
  settingsOutline, 
  statsChartOutline 
} from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';
import { ReportingService } from 'src/app/reporting/reporting.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [IonIcon, IonText, IonLabel, IonItemDivider, IonItem, IonContent, CurrencyPipe, RouterLink]
})
export class UserMenuComponent  implements OnInit {
  monthToDateUserCost = this.reportingService.monthToDateUserCostResource;
  user = this.authService.getCurrentUser();
  
  constructor(
    private reportingService: ReportingService, 
    private authService: AuthService, 
    private popoverController: PopoverController,
    private router: Router
  ) {
    addIcons({
      statsChartOutline, 
      lockClosedOutline, 
      barChartOutline, 
      settingsOutline,
      logOutOutline
    });
  }

  ngOnInit() {
  }

  hasAdminRole(): boolean {
    return true;
    const userRoles = this.user()?.roles || [];
    return userRoles.includes('DotNetDevelopers');
  }

  logout() {
    this.authService.logout();
    this.dismiss();
    this.router.navigate(['/login']);
  }

  dismiss() {
    this.popoverController.dismiss();
  }
}