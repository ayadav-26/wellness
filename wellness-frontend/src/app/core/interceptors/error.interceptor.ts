import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      let errorMsg = 'An unexpected error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMsg = error.error.message;
      } else {
        // Server-side error
        const isLoginReq = req.url.includes('/auth/login');

        if (error.status === 401 && !isLoginReq) {
          errorMsg = 'Session expired. Please login again.';
          authService.logout();
        } else if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.status === 403) {
          errorMsg = "You don't have permission to perform this action.";
        }
      }
      
      notificationService.error(errorMsg);
      return throwError(() => error);
    })
  );
};
