import { Injectable, resource, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DailyCost {
  modelId: string; inputTokens: number; outputTokens: number; totalCost: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private _monthToDateUserCostResource = resource({
    loader: async () => {
      const result = await this.loadUserMonthToDateCost();
      return result || { cost: 0 }; // Ensure a default value is returned
    }
  })
  get monthToDateUserCostResource() {
    return this._monthToDateUserCostResource.asReadonly()
  }
  constructor(private http: HttpClient) { }

  async loadUserMonthToDateCost(): Promise<{cost: number}> {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const url = `${environment.chatApiUrl}/reporting/users/monthly/${formattedDate}`;
      return lastValueFrom(this.http.get<{cost: number}>(url));
  }

  async loadUserDailyToDateCost(): Promise<any[]> {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const url = `${environment.chatApiUrl}/reporting/users/daily-breakdown/${formattedDate}`;
      return lastValueFrom(this.http.get<DailyCost[]>(url));
  }

  async loadUserYearToDateCost(): Promise<{cost: number}> {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}`;
      const url = `${environment.chatApiUrl}/reporting/users/yearly/${formattedDate}`;
      return lastValueFrom(this.http.get<{cost: number}>(url));
  }
}
