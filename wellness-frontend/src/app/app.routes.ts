import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
      },
      {
        path: 'reset-password/:token',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Dashboard')]
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(c => c.BookingListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist', 'User'], 'Bookings')]
      },
      {
        path: 'bookings/new',
        loadComponent: () => import('./features/bookings/booking-wizard/booking-wizard.component').then(c => c.BookingWizardComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist', 'User'], 'Bookings')]
      },
      {
        path: 'bookings/:id/reschedule',
        loadComponent: () => import('./features/bookings/booking-wizard/booking-wizard.component').then(c => c.BookingWizardComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist', 'User'], 'Bookings')]
      },
      {
        path: 'bookings/:id/edit',
        loadComponent: () => import('./features/bookings/booking-wizard/booking-wizard.component').then(c => c.BookingWizardComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Bookings')]
      },
      {
        path: 'centers',
        loadComponent: () => import('./features/centers/center-list/center-list.component').then(c => c.CenterListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Centers')]
      },
      {
        path: 'therapies',
        loadComponent: () => import('./features/therapies/therapy-list/therapy-list.component').then(c => c.TherapyListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Therapies')]
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list.component').then(c => c.CategoryListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Categories')]
      },
      {
        path: 'therapists',
        loadComponent: () => import('./features/therapists/therapist-list/therapist-list.component').then(c => c.TherapistListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Therapists')]
      },
      {
        path: 'working-hours',
        loadComponent: () => import('./features/therapists/working-hours/working-hours.component').then(c => c.WorkingHoursComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'WorkingHours')]
      },
      {
        path: 'leaves',
        loadComponent: () => import('./features/therapists/leave-list/leave-list.component').then(c => c.LeaveListComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin', 'Receptionist'], 'Leaves')]
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(c => c.ReportsComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin'], 'Reports')]
      },
      {
        path: 'user-management',
        loadComponent: () => import('./features/user-management/user-management.component').then(c => c.UserManagementComponent),
        canActivate: [roleGuard(['Super_Admin', 'Admin'], 'UserManagement')]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
