import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(HttpClient);
  private router = inject(Router);
  private permService = inject(PermissionService);
  private base = `${environment.apiBaseUrl}/auth`;

  currentUser = signal<User | null>(this.getStoredUser());

  login(payload: any): Observable<ApiResponse<{ token: string; user: User }>> {
    return this.api.post<ApiResponse<{ token: string; user: User }>>(`${this.base}/login`, payload).pipe(
      tap(res => {
        if (res.success) {
          sessionStorage.setItem('wellness_token', res.data.token);
          sessionStorage.setItem('wellness_user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }
      }),
      switchMap(res => {
        if (res.success) {
          // Load permissions from API immediately after login
          return this.permService.loadPermissions().pipe(
            switchMap(() => of(res))
          );
        }
        return of(res);
      })
    );
  }

  register(payload: any): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`${this.base}/register`, payload);
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`${this.base}/reset-password/${token}`, { password });
  }

  logout(): void {
    sessionStorage.removeItem('wellness_token');
    sessionStorage.removeItem('wellness_user');
    this.currentUser.set(null);
    this.permService.clearPermissions();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getToken(): string | null {
    return sessionStorage.getItem('wellness_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > (Date.now() / 1000);
    } catch {
      return false;
    }
  }

  private getStoredUser(): User | null {
    const stored = sessionStorage.getItem('wellness_user');
    return stored ? JSON.parse(stored) : null;
  }
}
