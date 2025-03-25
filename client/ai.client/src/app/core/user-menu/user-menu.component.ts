import { CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonContent, IonItem, IonItemDivider, IonLabel, IonText } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/auth/auth.service';
import { ReportingService } from 'src/app/reporting/reporting.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [IonText, IonLabel, IonItemDivider, IonItem, IonContent, CurrencyPipe]
})
export class UserMenuComponent  implements OnInit {
  monthToDateUserCost = this.reportingService.monthToDateUserCostResource;
  user = this.authService.currentUser;
  constructor(private reportingService: ReportingService, private authService: AuthService) { }

  ngOnInit() {
  }

}
