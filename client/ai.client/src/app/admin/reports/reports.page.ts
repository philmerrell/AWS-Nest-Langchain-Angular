import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList, 
         IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton, IonCard, IonCardHeader, 
         IonCardTitle, IonCardContent, IonSkeletonText, IonDatetime, IonButton, IonIcon,
         IonInfiniteScroll, IonInfiniteScrollContent, IonModal } from '@ionic/angular/standalone';
import { AdminReportService } from '../admin-report.service';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForwardOutline, refreshOutline } from 'ionicons/icons';
import { DatePipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [IonModal, 
    CommonModule, FormsModule, DatePipe, CurrencyPipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList,
    IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonSkeletonText, IonDatetime, IonButton, IonIcon,
    IonInfiniteScroll, IonInfiniteScrollContent
  ]
})
export class ReportsPage implements OnInit {
  currentDate: string;
  selectedSegment: string = 'daily';
  isDatePickerOpen: boolean = false;
  
  // Data states
  isLoading: boolean = false;
  dailyReports: any[] = [];
  topUsers: any[] = [];
  lastEvaluatedKey: any = null;
  
  constructor(private adminReportService: AdminReportService) { 
    addIcons({ calendarOutline, chevronForwardOutline, refreshOutline });
    
    // Initialize with current date in YYYY-MM-DD format
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadReports();
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.lastEvaluatedKey = null;
    this.loadReports(true);
  }

  async loadReports(refresh: boolean = false) {
    this.isLoading = true;
    
    if (refresh) {
      this.dailyReports = [];
      this.topUsers = [];
      this.lastEvaluatedKey = null;
    }
    
    try {
      if (this.selectedSegment === 'daily') {
        const result = await this.adminReportService.getDailyUserCosts(
          this.currentDate, 
          20, 
          refresh ? null : this.lastEvaluatedKey
        );
        
        this.dailyReports = refresh ? result.items : [...this.dailyReports, ...result.items];
        this.lastEvaluatedKey = result.lastKey;
      } else {
        const result = await this.adminReportService.getTopUsers(
          this.currentDate,
          20,
          refresh ? null : this.lastEvaluatedKey
        );
        
        this.topUsers = refresh ? result.items : [...this.topUsers, ...result.items];
        this.lastEvaluatedKey = result.lastKey;
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMore(event: any) {
    if (!this.lastEvaluatedKey) {
      event.target.complete();
      return;
    }
    
    await this.loadReports();
    event.target.complete();
  }

  async refresh() {
    this.loadReports(true);
  }

  onDateChange(event: any) {
    this.currentDate = event.detail.value.split('T')[0];
    this.isDatePickerOpen = false;
    this.loadReports(true);
  }

  openDatePicker() {
    this.isDatePickerOpen = true;
  }

  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  // Helper function to format Date from ISO string
  formatDate(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  }
}