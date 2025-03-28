// client/ai.client/src/app/admin/admin-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AdminReportResponse {
  items: any[];
  lastKey?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminReportService {
  constructor(private http: HttpClient) { }

  async getTopUsersByMonth(yearMonth: string, limit: number = 20, lastKey?: any): Promise<AdminReportResponse> {
    let url = `${environment.chatApiUrl}/reporting/admin/top-users/monthly/${yearMonth}?limit=${limit}`;
    
    if (lastKey) {
      url += `&lastKey=${encodeURIComponent(JSON.stringify(lastKey))}`;
    }
    
    return lastValueFrom(this.http.get<AdminReportResponse>(url));
  }
  
  async getTopUsersByYear(year: string, limit: number = 20, lastKey?: any): Promise<AdminReportResponse> {
    let url = `${environment.chatApiUrl}/reporting/admin/top-users/yearly/${year}?limit=${limit}`;
    
    if (lastKey) {
      url += `&lastKey=${encodeURIComponent(JSON.stringify(lastKey))}`;
    }
    
    return lastValueFrom(this.http.get<AdminReportResponse>(url));
  }


  /**
   * Gets top users by cost for a specific date
   * 
   * @param date Date in YYYY-MM-DD format
   * @param limit Number of items to return
   * @param lastKey Last evaluated key for pagination
   * @returns Promise with items and pagination key
   */
  async getTopUsers(date: string, limit: number = 20, lastKey?: any): Promise<AdminReportResponse> {
    let url = `${environment.chatApiUrl}/reporting/admin/top-users/${date}?limit=${limit}`;
    
    if (lastKey) {
      url += `&lastKey=${encodeURIComponent(JSON.stringify(lastKey))}`;
    }
    
    return lastValueFrom(this.http.get<AdminReportResponse>(url));
  }

  /**
   * Gets monthly summary for administrative purposes
   * 
   * @param yearMonth Year and month in YYYY-MM format
   * @returns Promise with monthly summary data
   */
  async getAdminMonthlySummary(yearMonth: string): Promise<any> {
    const url = `${environment.chatApiUrl}/reporting/admin/monthly-summary/${yearMonth}`;
    return lastValueFrom(this.http.get(url));
  }
}