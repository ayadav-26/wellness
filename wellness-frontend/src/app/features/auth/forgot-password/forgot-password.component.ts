import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-page">
      <div class="login-brand">
        <div class="brand-name">WellnessHub</div>
        <div class="brand-tagline">Restoring access to your sanctuary.</div>
      </div>

      <div class="login-form-panel">
        <div class="form-title">Forgot Password?</div>
        <div class="form-subtitle">Enter your email to receive a password reset link.</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
            <mat-icon matPrefix>mail</mat-icon>
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>This field is required</mat-error>
            } @else if (form.get('email')?.hasError('email')) {
              <mat-error>Please enter a valid email address</mat-error>
            }
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Send Reset Link
            }
          </button>

          <div class="auth-footer">
            Remembered your password? <a routerLink="/login">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = signal(false);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email } = this.form.value;

    this.auth.forgotPassword(email!).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notify.success('If that email exists, a reset link has been sent.');
          this.form.reset();
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
