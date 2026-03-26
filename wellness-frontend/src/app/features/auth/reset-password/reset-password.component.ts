import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-page">
      <div class="login-brand">
        <div class="brand-name">WellnessHub</div>
        <div class="brand-tagline">Secure your sanctuary with a new password.</div>
      </div>

      <div class="login-form-panel">
        <div class="form-title">Reset Password</div>
        <div class="form-subtitle">Enter your new password below.</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>New Password</mat-label>
            <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'" />
            <mat-icon matPrefix>lock</mat-icon>
            <button type="button" mat-icon-button matSuffix (click)="togglePassword()">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>This field is required</mat-error>
            } @else if (form.get('password')?.hasError('pattern')) {
              <mat-error>Password must be min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <input matInput formControlName="confirmPassword" [type]="hidePassword() ? 'password' : 'text'" />
            <mat-icon matPrefix>lock</mat-icon>
            @if (form.get('confirmPassword')?.hasError('required') && form.get('confirmPassword')?.touched) {
              <mat-error>This field is required</mat-error>
            } @else if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Reset Password
            }
          </button>

          <div class="auth-footer">
            <a routerLink="/login">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  token: string | null = null;
  loading = signal(false);
  hidePassword = signal(true);

  form = this.fb.group({
    password: ['', [
      Validators.required, 
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.notify.error('Invalid or missing reset token.');
      this.router.navigate(['/login']);
    }
  }

  togglePassword() {
    this.hidePassword.update(v => !v);
  }

  passwordMatchValidator(g: any) {
    return g.get('password').value === g.get('confirmPassword').value ? null : { 'mismatch': true };
  }

  submit() {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { password } = this.form.value;

    this.auth.resetPassword(this.token, password!).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notify.success('Password reset successful! You can now login.');
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
