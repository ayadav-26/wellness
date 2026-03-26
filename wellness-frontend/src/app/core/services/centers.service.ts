import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Center } from '../models/center.model';

@Injectable({ providedIn: 'root' })
export class CentersService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/centers`;

  getAll(params?: any): Observable<ApiResponse<PaginatedResponse<Center>>> {
    return this.api.get<ApiResponse<PaginatedResponse<Center>>>(this.base, { params: { ...params } });
  }

  getById(id: number): Observable<ApiResponse<Center>> {
    return this.api.get<ApiResponse<Center>>(`${this.base}/${id}`);
  }

  create(payload: Partial<Center>): Observable<ApiResponse<Center>> {
    return this.api.post<ApiResponse<Center>>(this.base, payload);
  }

  update(id: number, payload: Partial<Center>): Observable<ApiResponse<Center>> {
    return this.api.put<ApiResponse<Center>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  linkCategory(centerId: number, categoryId: number): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`${this.base}/${centerId}/categories`, { categoryId });
  }

  unlinkCategory(centerId: number, categoryId: number): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${this.base}/${centerId}/categories/${categoryId}`);
  }
}
