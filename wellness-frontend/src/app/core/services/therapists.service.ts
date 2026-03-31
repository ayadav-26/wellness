import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TherapistsService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/therapists`;

  getAll(params?: any): Observable<ApiResponse<PaginatedResponse<any>>> {
    return this.api.get<ApiResponse<PaginatedResponse<any>>>(this.base, { params: { ...params } });
  }

  getById(id: number, includeInactive?: boolean): Observable<ApiResponse<any>> {
    const params: any = { includeInactive: !!includeInactive };
    return this.api.get<ApiResponse<any>>(`${this.base}/${id}`, { params });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
