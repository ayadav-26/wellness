import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private api = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/search`;

  searchTherapies(params: any): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(`${this.base}/therapies`, { params });
  }
}
