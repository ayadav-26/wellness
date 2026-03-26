import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardTrendItem {
  date: string;
  day: string;
  count: number;
}

export interface DashboardBooking {
  bookingId: number;
  customer: string;
  therapy: string;
  therapist: string;
  time: string;
  status: string;
}

export interface DashboardStats {
  bookingsToday: number;
  activeTherapists: number;
  cancellationsToday: number;
  weeklyTrend: DashboardTrendItem[];
  upcomingToday: DashboardBooking[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/dashboard`;

  getStats(centerId?: number): Observable<{ success: boolean; data: DashboardStats }> {
    const params: any = {};
    if (centerId) params['centerId'] = centerId;
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.base}/stats`, { params });
  }
}
