// client/ai.client/src/app/core/user-menu/user-menu.component.ts
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonItem, IonItemDivider, IonLabel, IonText, PopoverController, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
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
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [IonIcon, IonText, IonLabel, IonItemDivider, IonItem, IonContent, CurrencyPipe, RouterLink, IonSelect, IonSelectOption, AsyncPipe]
})
export class UserMenuComponent  implements OnInit {
  monthToDateUserCost = this.reportingService.monthToDateUserCostResource;
  user = this.authService.getCurrentUser();
  paletteToggle: boolean = false;
  theme$ = this.themeService.theme$;
  
  constructor(
    private authService: AuthService, 
    private popoverController: PopoverController,
    private reportingService: ReportingService, 
    private router: Router,
    private themeService: ThemeService
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

  handleThemeChange(ev: any) {
    const value = ev.detail.value;
    this.themeService.changeTheme(value);
  }

  hasAdminRole(): boolean {
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