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
  selectedPeriod: string = 'day';
  isDatePickerOpen: boolean = false;
  
  // Data states
  isLoading: boolean = false;
  topUsers: any[] = [];
  lastEvaluatedKey: any = null;
  
  constructor(private adminReportService: AdminReportService) { 
    addIcons({ calendarOutline, chevronForwardOutline, refreshOutline });
    
    // Initialize with current date
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadReports();
  }

  periodChanged(event: any) {
    this.selectedPeriod = event.detail.value;
    this.lastEvaluatedKey = null;
    
    // Adjust date format based on period
    const today = new Date();
    if (this.selectedPeriod === 'day') {
      this.currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (this.selectedPeriod === 'month') {
      this.currentDate = today.toISOString().substring(0, 7); // YYYY-MM
    } else if (this.selectedPeriod === 'year') {
      this.currentDate = today.getFullYear().toString(); // YYYY
    }
    
    this.loadReports(true);
  }

  async loadReports(refresh: boolean = false) {
    this.isLoading = true;
    
    if (refresh) {
      this.topUsers = [];
      this.lastEvaluatedKey = null;
    }
    
    try {
        // Load top users based on selected period
        let result;
        if (this.selectedPeriod === 'day') {
          result = await this.adminReportService.getTopUsers(
            this.currentDate,
            20,
            refresh ? null : this.lastEvaluatedKey
          );
        } else if (this.selectedPeriod === 'month') {
          result = await this.adminReportService.getTopUsersByMonth(
            this.currentDate,
            20,
            refresh ? null : this.lastEvaluatedKey
          );
        } else if (this.selectedPeriod === 'year') {
          result = await this.adminReportService.getTopUsersByYear(
            this.currentDate,
            20,
            refresh ? null : this.lastEvaluatedKey
          );
        }
        
        this.topUsers = refresh ? (result?.items ?? []) : [...this.topUsers, ...(result?.items ?? [])];
        this.lastEvaluatedKey = result?.lastKey;
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