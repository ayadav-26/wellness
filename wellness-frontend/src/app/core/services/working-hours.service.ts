import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class WorkingHoursService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/working-hours`;

  getAll(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(this.base, { params });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${this.base}/${id}`);
  }

  getMatrix(params?: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/matrix`, { params: { ...params } });
  }
}
