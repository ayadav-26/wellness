import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/reports`;

  getBookingTrends(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/booking-trends`, { params });
  }

  getTherapistUtilization(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/therapist-utilization`, { params });
  }

  getPeakTimes(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/peak-times`, { params });
  }
  
  getCancellations(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/cancellations`, { params });
  }

  getCustomerHistory(phone: string): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/customer-history`, { params: { customerPhone: phone } });
  }
}
