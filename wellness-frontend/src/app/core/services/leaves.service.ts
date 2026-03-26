import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LeavesService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/leaves`;

  getAll(params?: any): Observable<ApiResponse<PaginatedResponse<any>>> {
    return this.api.get<ApiResponse<PaginatedResponse<any>>>(this.base, { params: { ...params } });
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(this.base, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
