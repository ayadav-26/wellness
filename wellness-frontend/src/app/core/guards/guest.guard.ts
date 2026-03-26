import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Determine redirection based on role
  const user = authService.getCurrentUser();
  if (user?.role === 'Admin' || user?.role === 'Receptionist') {
    return router.parseUrl('/dashboard');
  }
  return router.parseUrl('/bookings');
};
