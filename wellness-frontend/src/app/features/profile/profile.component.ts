import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomValidators } from '../../core/validators/custom.validators';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImageCropperDialogComponent } from '../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatButtonModule, MatInputModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">My Profile</h1>
      <p class="text-secondary">View and manage your account information</p>
    </div>

    <div class="profile-layout">
      <mat-card class="profile-card">
        <mat-card-content>

          <!-- ── Avatar Section ── -->
          <div class="avatar-section">
            <div class="avatar-ring" (click)="pickFile()" matTooltip="Change profile picture">
              @if (imagePreview()) {
                <img [src]="imagePreview()" class="avatar-img" alt="Profile" />
              } @else if (user()?.profileImageUrl) {
                <img [src]="user()!.profileImageUrl!" class="avatar-img" alt="Profile"
                     (error)="onImgError($event)" />
              } @else {
                <span class="avatar-initials">{{ user()?.firstName?.charAt(0) || 'U' }}</span>
              }
              <div class="avatar-overlay">
                <mat-icon>photo_camera</mat-icon>
              </div>
            </div>

            <input type="file" #fileInput (change)="onFileSelected($event)"
                   accept="image/jpeg,image/jpg,image/png" style="display:none" />

            <div class="avatar-meta">
              <span class="avatar-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              <span class="avatar-role">{{ formatRole(user()?.role) }}</span>
            </div>

            <!-- Pending image actions -->
            @if (imagePreview()) {
              <div class="pending-actions">
                <span class="pending-label">New photo selected</span>
                <button mat-stroked-button color="warn" size="small"
                        (click)="clearPendingImage()">Discard</button>
              </div>
            }

            <!-- Helper & error -->
            <p class="photo-hint">Accepted: JPG, JPEG, PNG · Max 2MB</p>
            @if (fileError()) {
              <p class="photo-error">
                <mat-icon>error_outline</mat-icon> {{ fileError() }}
              </p>
            }
          </div>

          <!-- ── Profile Form ── -->
          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="profile-form">
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
                <mat-hint>Only contact number can be updated</mat-hint>
                @if (profileForm.get('phone')?.hasError('required') && (profileForm.get('phone')?.touched || profileForm.get('phone')?.dirty)) {
                  <mat-error>Required</mat-error>
                } @else if (profileForm.get('phone')?.hasError('invalidPhone') && (profileForm.get('phone')?.touched || profileForm.get('phone')?.dirty)) {
                  <mat-error>Invalid 10-digit number</mat-error>
                } @else if (profileForm.get('phone')?.hasError('invalidStart') && (profileForm.get('phone')?.touched || profileForm.get('phone')?.dirty)) {
                  <mat-error>Must start with 6, 7, 8, or 9</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="details-section">
              <h3 class="section-title">Account Details</h3>
              <div class="details-grid">
                @if (user()?.role !== 'User') {
                  <div class="detail-item">
                    <span class="label">Primary Center</span>
                    <span class="value">{{ centerName() }}</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="label">Account Status</span>
                  <span class="value status-active">Active</span>
                </div>
              </div>
            </div>

            <div class="actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="profileForm.invalid || loading() || (!profileForm.dirty && !croppedBlob)">
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
    .page-header { margin-bottom: 28px; }
    h1 { color: #1A1A1A; margin: 0; }
    .text-secondary { color: #777; margin: 4px 0 0; }

    .profile-layout { display: flex; justify-content: center; }
    .profile-card { width: 100%; max-width: 820px; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

    /* ── Avatar ── */
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 0 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    .avatar-ring {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid #e3d9ff;
      background: #ededf7;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(103,58,183,0.15);
      flex-shrink: 0;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: #673ab7;
        box-shadow: 0 4px 20px rgba(103,58,183,0.3);

        .avatar-overlay { opacity: 1; }
      }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-initials {
      font-size: 44px;
      font-weight: 700;
      color: #673ab7;
      text-transform: uppercase;
      line-height: 1;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      border-radius: 50%;

      mat-icon { color: white; font-size: 26px; width: 26px; height: 26px; }
    }

    .avatar-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 14px;
      gap: 4px;
    }

    .avatar-name { font-size: 18px; font-weight: 600; color: #1a1a1a; }
    .avatar-role {
      font-size: 12px; color: #673ab7; font-weight: 600;
      background: #f3eeff; padding: 2px 10px; border-radius: 12px;
    }

    .pending-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
    }

    .pending-label {
      font-size: 12px;
      color: #388e3c;
      font-weight: 500;
      background: #e8f5e9;
      padding: 2px 10px;
      border-radius: 10px;
    }

    .photo-hint {
      font-size: 11px;
      color: #aaa;
      margin: 10px 0 0;
    }

    .photo-error {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #c62828;
      margin: 4px 0 0;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Form ── */
    .profile-form { padding: 24px 0 0; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

    .details-section { margin-top: 24px; }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #673ab7;
      margin-bottom: 14px;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 600px) { .details-grid { grid-template-columns: 1fr; } }

    .detail-item { display: flex; flex-direction: column; gap: 3px; }
    .detail-item .label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item .value { font-size: 14px; font-weight: 500; color: #1A1A1A; }
    .status-active { color: #2e7d32 !important; font-weight: 600 !important; }

    .actions { display: flex; justify-content: flex-end; margin-top: 28px; }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private matDialog = inject(MatDialog);

  user = this.auth.currentUser;
  loading = signal(false);
  centerName = signal<string>('Loading...');
  imagePreview = signal<string | null>(null);
  fileError = signal<string | null>(null);
  croppedBlob: Blob | null = null;

  profileForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: ['', [Validators.required, CustomValidators.phoneNumber()]]
  });

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const u = this.user();
    if (!u) return;

    this.profileForm.patchValue({
      firstName: u.firstName,
      lastName: u.lastName || '',
      email: u.email,
      phone: u.phone || u.phoneNumber || ''
    });

    this.userService.getById(u.userId).subscribe({
      next: (res) => {
        if (res.success) {
          const full = res.data;
          this.profileForm.patchValue({
            firstName: full.firstName,
            lastName: full.lastName,
            email: full.email,
            phone: full.phoneNumber || full.phone
          });
          this.centerName.set(full.center?.name || 'N/A');
          if (full.profileImageUrl && !u.profileImageUrl) {
            const updated = { ...u, profileImageUrl: full.profileImageUrl };
            sessionStorage.setItem('wellness_user', JSON.stringify(updated));
            this.auth.currentUser.set(updated);
          }
        }
      },
      error: () => this.centerName.set('N/A')
    });
  }

  pickFile() {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  onFileSelected(event: Event) {
    this.fileError.set(null);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.fileError.set('Unsupported format. Please upload a JPG, JPEG, or PNG file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.fileError.set('File size exceeds 2MB. Please upload a smaller image.');
      return;
    }

    const ref = this.matDialog.open(ImageCropperDialogComponent, {
      data: { imageFile: file },
      width: '460px',
      disableClose: true,
      panelClass: 'cropper-dialog-panel'
    });

    ref.afterClosed().subscribe((blob: Blob | null) => {
      if (blob) {
        this.croppedBlob = blob;
        this.imagePreview.set(URL.createObjectURL(blob));
        this.profileForm.markAsDirty();
      }
      (event.target as HTMLInputElement).value = '';
    });
  }

  clearPendingImage() {
    this.croppedBlob = null;
    this.imagePreview.set(null);
    this.profileForm.markAsPristine();
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  formatRole(role?: string): string {
    return role ? role.replace('_', ' ') : 'User';
  }

  centerInfo(): string { return this.centerName(); }

  onSave() {
    if (this.profileForm.invalid) return;
    const u = this.user();
    if (!u) return;

    this.loading.set(true);
    const phoneNumber = this.profileForm.get('phone')?.value || '';

    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber);
    if (this.croppedBlob) {
      formData.append('profileImage', this.croppedBlob, 'profile.jpg');
    }

    this.userService.update(u.userId, formData).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notify.success('Profile updated successfully');
          this.croppedBlob = null;
          this.imagePreview.set(null);
          const updated: any = {
            ...u,
            phone: phoneNumber,
            phoneNumber,
            profileImageUrl: res.data.profileImageUrl || u.profileImageUrl
          };
          sessionStorage.setItem('wellness_user', JSON.stringify(updated));
          this.auth.currentUser.set(updated);
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
