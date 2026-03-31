import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { CustomValidators } from '../../../core/validators/custom.validators';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageCropperDialogComponent } from '../../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private matDialog = inject(MatDialog);

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phoneNumber: ['', [Validators.required, CustomValidators.phoneNumber()]],
    // role is always assigned server-side as 'User' — not included here
  });

  croppedBlob: Blob | null = null;
  imagePreview = signal<string | null>(null);
  fileError = signal<string | null>(null);
  loading = signal(false);
  hidePassword = signal(true);

  togglePassword() {
    this.hidePassword.update(v => !v);
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
      }
      (event.target as HTMLInputElement).value = '';
    });
  }

  removeImage() {
    this.croppedBlob = null;
    this.imagePreview.set(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formData = new FormData();
    Object.keys(this.form.value).forEach(key => {
      const value = (this.form.value as any)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (this.croppedBlob) {
      formData.append('profileImage', this.croppedBlob, 'profile.jpg');
    }

    this.auth.register(formData).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.notify.success('Account created successfully! Please log in.');
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
