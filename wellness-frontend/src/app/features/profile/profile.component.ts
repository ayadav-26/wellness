import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatButtonModule, MatInputModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">My Profile</h1>
      <p class="text-secondary">View and manage your account information</p>
    </div>

    <div class="profile-container">
      <mat-card class="profile-card">
        <!-- <mat-card-header class="profile-header">
          <div mat-card-avatar class="avatar-placeholder">
            {{ user()?.firstName?.charAt(0) || 'U' }}
          </div>
          <div class="header-text ml-6">
            <mat-card-title class="name-title">{{ user()?.firstName }} {{ user()?.lastName }}</mat-card-title>
          </div>
        </mat-card-header> -->

        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="profile-form mt-6">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email">
                <mat-icon matPrefix>email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone">
                <mat-icon matPrefix>phone</mat-icon>
                <mat-hint>You can only update your contact number</mat-hint>
              </mat-form-field>
            </div>

            <div class="details-section mt-6">
              <h3 class="section-title">Account Details</h3>
              <div class="details-grid">
                @if (user()?.role !== 'User') {
                  <div class="detail-item">
                    <span class="label">Primary Center</span>
                    <span class="value">{{ centerInfo() }}</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="label">Account Status</span>
                  <span class="value status-active">Active</span>
                </div>
              </div>
            </div>

            <div class="actions mt-8">
              <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || loading() || !profileForm.dirty">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Save Changes
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 32px; }
    h1 { color: #1A1A1A; margin: 0; font-family: 'Cormorant Garamond', serif; }
    .text-secondary { color: #666; margin: 4px 0 0 0; }
    
    .profile-container { display: flex; justify-content: center; }
    .profile-card { width: 100%; max-width: 800px; padding: 16px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }

    .avatar-placeholder {
      background: #2C5F5D;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: bold;
      font-size: 24px;
      width: 56px;
      height: 56px;
    }

    .profile-header { display: flex; align-items: center; }
    .header-text { display: flex; flex-direction: column; }
    .name-title { margin: 0 !important; font-size: 26px; font-weight: 600; color: #1A1A1A; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

    .section-title { font-size: 16px; font-weight: 600; color: #2C5F5D; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    
    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    @media (max-width: 600px) { .details-grid { grid-template-columns: 1fr; gap: 12px; } }

    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-item .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item .value { font-size: 14px; font-weight: 500; color: #1A1A1A; }
    .status-active { color: #2e7d32; font-weight: 600; }

    .actions { display: flex; justify-content: flex-end; }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  user = this.auth.currentUser;
  loading = signal(false);
  centerName = signal<string>('Loading...');

  profileForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+() -]{8,20}$/)]]
  });

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const u = this.user();
    if (!u) return;

    // Patch initial values from signal
    this.profileForm.patchValue({
      firstName: u.firstName,
      lastName: u.lastName || '',
      email: u.email,
      phone: u.phone || u.phoneNumber || ''
    });

    // Fetch full data to get center name
    this.userService.getById(u.userId).subscribe({
      next: (res) => {
        if (res.success) {
          const fullUser = res.data;
          this.profileForm.patchValue({
            firstName: fullUser.firstName,
            lastName: fullUser.lastName,
            email: fullUser.email,
            phone: fullUser.phoneNumber || fullUser.phone
          });
          this.centerName.set(fullUser.center?.name || 'N/A');
        }
      },
      error: () => this.centerName.set('N/A')
    });
  }

  formatRole(role?: string): string {
    if (!role) return 'User';
    return role.split('_').join(' ');
  }

  centerInfo(): string {
    return this.centerName();
  }

  onSave() {
    if (this.profileForm.invalid) return;

    const u = this.user();
    if (!u) return;

    this.loading.set(true);
    const phoneNumber = this.profileForm.get('phone')?.value || '';

    this.userService.update(u.userId, { phoneNumber }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notify.success('Profile updated successfully');
          // Update local storage and signal
          const updatedUser: any = {
            ...u,
            phone: phoneNumber,
            phoneNumber: phoneNumber
          };
          sessionStorage.setItem('wellness_user', JSON.stringify(updatedUser));
          this.auth.currentUser.set(updatedUser);
          this.profileForm.markAsPristine();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Failed to update profile');
      }
    });
  }
}
