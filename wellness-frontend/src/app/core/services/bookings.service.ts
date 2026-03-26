import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Booking } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/bookings`;

  getAll(params?: any): Observable<ApiResponse<PaginatedResponse<Booking>>> {
    return this.api.get<ApiResponse<PaginatedResponse<Booking>>>(this.base, { params: { ...params } });
  }

  getById(id: number): Observable<ApiResponse<Booking>> {
    return this.api.get<ApiResponse<Booking>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<Booking>> {
    return this.api.post<ApiResponse<Booking>>(this.base, payload);
  }

  update(id: number, payload: Partial<Booking>): Observable<ApiResponse<Booking>> {
    return this.api.put<ApiResponse<Booking>>(`${this.base}/${id}`, payload);
  }

  patch(id: number, payload: Partial<Booking>): Observable<ApiResponse<Booking>> {
    return this.api.patch<ApiResponse<Booking>>(`${this.base}/${id}`, payload);
  }

  updateStatus(id: number, status: string): Observable<ApiResponse<Booking>> {
    return this.api.put<ApiResponse<Booking>>(`${this.base}/${id}/status`, { status });
  }

  cancel(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
