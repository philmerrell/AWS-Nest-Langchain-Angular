import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonList, IonLabel, IonBadge, IonItemDivider, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { DailyCost, ReportingService } from './reporting.service';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.page.html',
  styleUrls: ['./reporting.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, IonItemDivider, IonBadge, IonLabel, IonList, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ReportingPage implements OnInit {
  today = new Date();
  daily: DailyCost[] = [];
  monthly = { cost: 0 };
  yearly = { cost: 0 };
  constructor(private reportingService: ReportingService) { }

  async ngOnInit() {
    this.daily = await this.reportingService.loadUserDailyToDateCost();
    this.monthly = await this.reportingService.loadUserMonthToDateCost();
    this.yearly = await this.reportingService.loadUserYearToDateCost();
  }





}
