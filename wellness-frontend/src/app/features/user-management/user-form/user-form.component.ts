import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user.service';
import { CentersService } from '../../../core/services/centers.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../core/validators/custom.validators';
import { ImageCropperDialogComponent } from '../../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatRadioModule,
    MatIconModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="align-middle mr-2">{{ data ? 'edit' : 'person_add' }}</mat-icon>
      {{ data ? 'Edit User' : 'Create New User' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
        
        <!-- Role Selection (Only for Create) -->
        @if (!data) {
          <div class="role-box p-3 bg-slate-50 border rounded-lg">
            <label class="block text-sm font-medium mb-2 text-slate-600">Account Type</label>
            <mat-radio-group formControlName="role" class="flex gap-6">
              @if (perm.isSuperAdmin()) {
                <mat-radio-button value="Admin">Admin</mat-radio-button>
              }
              <mat-radio-button value="Receptionist">Receptionist</mat-radio-button>
            </mat-radio-group>
          </div>
        }

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" maxlength="50" />
            @if (form.get('firstName')?.errors?.['maxlength']) {
              <mat-error>Max 50 characters</mat-error>
            }
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" maxlength="50" />
            @if (form.get('lastName')?.errors?.['maxlength']) {
              <mat-error>Max 50 characters</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Email Address</mat-label>
          <input matInput type="email" formControlName="email" maxlength="100" />
          @if (form.get('email')?.errors?.['maxlength']) {
            <mat-error>Max 100 characters</mat-error>
          }
        </mat-form-field>

        <div style="display: flex; flex-direction: row; gap: 8px; width: 100%; align-items: flex-start;">
          <div style="width: 140px; flex-shrink: 0;">
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Region</mat-label>
              <mat-select formControlName="region">
                <mat-option value="+91">+91</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div style="flex: 1; min-width: 0;">
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phoneNumber" maxlength="10" placeholder="10-digit number" />
              @if (form.get('phoneNumber')?.hasError('required') && (form.get('phoneNumber')?.touched || form.get('phoneNumber')?.dirty)) {
                <mat-error>Required</mat-error>
              } @else if (form.get('phoneNumber')?.hasError('invalidPhone') && (form.get('phoneNumber')?.touched || form.get('phoneNumber')?.dirty)) {
                <mat-error>Invalid 10-digit number</mat-error>
              } @else if (form.get('phoneNumber')?.hasError('invalidStart') && (form.get('phoneNumber')?.touched || form.get('phoneNumber')?.dirty)) {
                <mat-error>Must start with 6, 7, 8, or 9</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        @if (!data) {
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" maxlength="50" />
            @if (form.get('password')?.errors?.['maxlength']) {
              <mat-error>Max 50 characters</mat-error>
            }
          </mat-form-field>
        }

        <!-- Center selection -->
        @if (form.get('role')?.value === 'Receptionist' || (form.get('role')?.value === 'Admin' && perm.isSuperAdmin())) {
          <mat-form-field appearance="outline">
            <mat-label>Assigned Center</mat-label>
            <mat-select formControlName="centerId">
              <mat-option [value]="null">No Center (Global)</mat-option>
              @for (c of centers(); track c.centerId) {
                <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <!-- ── Profile Picture Upload ── -->
        <div class="photo-section">
          <label class="photo-section-label">Profile Picture <span class="optional-tag">Optional</span></label>

          <div class="photo-layout">
            <!-- Circular Avatar -->
            <div class="avatar-circle" (click)="triggerFilePicker()" matTooltip="Click to change photo">
              @if (imagePreview()) {
                <img [src]="imagePreview()" alt="Profile Preview" class="avatar-img" />
              } @else {
                <mat-icon class="avatar-placeholder-icon">account_circle</mat-icon>
              }
              <div class="camera-overlay">
                <mat-icon>photo_camera</mat-icon>
              </div>
            </div>

            <!-- Actions -->
            <div class="photo-actions">
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/jpeg,image/jpg,image/png" style="display:none" />
              <button type="button" mat-stroked-button color="primary" (click)="triggerFilePicker()">
                <mat-icon>upload</mat-icon>
                {{ imagePreview() ? 'Change' : 'Upload Photo' }}
              </button>

              @if (imagePreview() && !confirmRemove()) {
                <button type="button" mat-button color="warn" (click)="confirmRemove.set(true)">
                  <mat-icon>delete_outline</mat-icon>
                  Remove
                </button>
              }
              @if (confirmRemove()) {
                <div class="remove-confirm">
                  <span>Remove photo?</span>
                  <button type="button" mat-flat-button color="warn" (click)="removeImage()">Yes, Remove</button>
                  <button type="button" mat-button (click)="confirmRemove.set(false)">Cancel</button>
                </div>
              }
            </div>
          </div>

          <!-- Helper text -->
          <p class="photo-hint">Accepted: JPG, JPEG, PNG &nbsp;·&nbsp; Max 2MB</p>
          @if (fileError()) {
            <p class="photo-error"><mat-icon>error_outline</mat-icon> {{ fileError() }}</p>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="submitting() || form.invalid" 
              (click)="submit()">
        @if (submitting()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          {{ data ? 'Update' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Photo section */
    .photo-section {
      padding: 12px 16px;
      background: #f8f7ff;
      border: 1px solid #e8e3ff;
      border-radius: 10px;
    }

    .photo-section-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #666;
      margin-bottom: 12px;
    }

    .optional-tag {
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: #aaa;
      font-size: 11px;
      margin-left: 4px;
    }

    .photo-layout {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Circular avatar */
    .avatar-circle {
      position: relative;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 2px solid #ddd;
      overflow: hidden;
      cursor: pointer;
      flex-shrink: 0;
      background: #ededf7;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s;

      &:hover {
        border-color: #673ab7;

        .camera-overlay {
          opacity: 1;
        }
      }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #bbb;
    }

    .camera-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      border-radius: 50%;

      mat-icon {
        color: white;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    /* Action buttons */
    .photo-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
    }

    .remove-confirm {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;

      span {
        font-size: 12px;
        color: #c62828;
        font-weight: 500;
      }

      button {
        font-size: 12px;
        padding: 0 10px;
        min-width: 0;
        height: 30px;
        line-height: 30px;
      }
    }

    /* Helper text */
    .photo-hint {
      font-size: 11px;
      color: #999;
      margin: 10px 0 0 0;
    }

    .photo-error {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #c62828;
      margin: 4px 0 0 0;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class UserFormComponent implements OnInit {
  data = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserFormComponent>);

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private centersService = inject(CentersService);
  private notify = inject(NotificationService);
  private matDialog = inject(MatDialog);
  perm = inject(PermissionService);

  submitting = signal(false);
  centers = signal<any[]>([]);
  imagePreview = signal<string | null>(null);
  confirmRemove = signal(false);
  fileError = signal<string | null>(null);
  croppedBlob: Blob | null = null;

  form = this.fb.group({
    firstName: [this.data?.firstName || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    lastName: [this.data?.lastName || '', [Validators.maxLength(50), CustomValidators.noWhitespace()]],
    email: [this.data?.email || '', [Validators.required, Validators.email, Validators.maxLength(100), CustomValidators.noWhitespace()]],
    phoneNumber: [this.data?.phoneNumber || '', [Validators.required, CustomValidators.phoneNumber()]],
    region: [this.data?.region || '+91', Validators.required],
    password: ['', this.data ? [] : [Validators.required, Validators.minLength(6), Validators.maxLength(50), CustomValidators.noWhitespace()]],
    role: [this.data?.role || 'Receptionist', Validators.required],
    centerId: [this.data?.centerId || null]
  });

  ngOnInit() {
    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
    });

    if (this.data && this.data.userId) {
      this.form.get('role')?.disable();
      this.form.get('email')?.disable();

      this.submitting.set(true);
      this.userService.getById(this.data.userId).subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.data) {
            this.populateForm(res.data);
            if (res.data.profileImageUrl) {
              this.imagePreview.set(res.data.profileImageUrl);
            }
          }
        },
        error: () => this.submitting.set(false)
      });
    }
  }

  triggerFilePicker() {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  onFileSelected(event: Event) {
    this.fileError.set(null);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.fileError.set('Unsupported format. Please upload a JPG, JPEG, or PNG file.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.fileError.set('File size exceeds 2MB. Please upload a smaller image.');
      return;
    }

    // Open cropper dialog
    const ref = this.matDialog.open(ImageCropperDialogComponent, {
      data: { imageFile: file },
      width: '460px',
      disableClose: true,
      panelClass: 'cropper-dialog-panel'
    });

    ref.afterClosed().subscribe((blob: Blob | null) => {
      if (blob) {
        this.croppedBlob = blob;
        const url = URL.createObjectURL(blob);
        this.imagePreview.set(url);
        this.confirmRemove.set(false);
      }
      // Reset file input so same file can be re-selected
      (event.target as HTMLInputElement).value = '';
    });
  }

  removeImage() {
    this.croppedBlob = null;
    this.imagePreview.set(null);
    this.confirmRemove.set(false);
  }

  private populateForm(user: any) {
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      centerId: user.centerId
    });

    if (user.phoneNumber && user.phoneNumber.startsWith('+')) {
      const local = user.phoneNumber.slice(-10);
      const region = user.phoneNumber.slice(0, -10);
      this.form.patchValue({ phoneNumber: local, region: region || '+91' }, { emitEvent: false });
    } else if (user.phoneNumber && user.phoneNumber.length > 10) {
      this.form.patchValue({ phoneNumber: user.phoneNumber.slice(-10), region: user.region || '+91' }, { emitEvent: false });
    } else {
      this.form.patchValue({ phoneNumber: user.phoneNumber, region: user.region || '+91' }, { emitEvent: false });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const formVal = this.form.getRawValue();
    const isRec = formVal.role === 'Receptionist';

    const formData = new FormData();
    Object.keys(formVal).forEach(key => {
      const value = (formVal as any)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (this.croppedBlob) {
      formData.append('profileImage', this.croppedBlob, 'profile.jpg');
    }

    if (this.data) {
      this.userService.update(this.data.userId, formData).subscribe({
        next: () => {
          this.notify.success('User updated successfully');
          this.dialogRef.close(true);
        },
        error: () => this.submitting.set(false)
      });
      return;
    }

    const request = isRec
      ? this.userService.createReceptionist(formData)
      : this.userService.createAdmin(formData);

    request.subscribe({
      next: () => {
        this.notify.success(`${formVal.role} created successfully!`);
        this.dialogRef.close(true);
      },
      error: () => this.submitting.set(false)
    });
  }
}
