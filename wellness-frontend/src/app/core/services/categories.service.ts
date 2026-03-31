import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { TherapyCategory } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/categories`;

  getAll(params?: any): Observable<ApiResponse<PaginatedResponse<TherapyCategory>>> {
    return this.api.get<ApiResponse<PaginatedResponse<TherapyCategory>>>(this.base, { params: { ...params } });
  }

  getById(id: number, includeInactive?: boolean): Observable<ApiResponse<TherapyCategory>> {
    const params: any = {};
    if (includeInactive) params.includeInactive = true;
    return this.api.get<ApiResponse<TherapyCategory>>(`${this.base}/${id}`, { params });
  }

  create(payload: Partial<TherapyCategory>): Observable<ApiResponse<TherapyCategory>> {
    return this.api.post<ApiResponse<TherapyCategory>>(this.base, payload);
  }

  update(id: number, payload: Partial<TherapyCategory>): Observable<ApiResponse<TherapyCategory>> {
    return this.api.put<ApiResponse<TherapyCategory>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
