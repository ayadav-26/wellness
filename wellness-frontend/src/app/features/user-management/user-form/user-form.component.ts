import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { CentersService } from '../../../core/services/centers.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../core/validators/custom.validators';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatRadioModule, MatIconModule, MatProgressSpinnerModule
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

})
export class UserFormComponent implements OnInit {
  data = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserFormComponent>);

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private centersService = inject(CentersService);
  private notify = inject(NotificationService);
  perm = inject(PermissionService);

  submitting = signal(false);
  centers = signal<any[]>([]);

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
          }
        },
        error: () => this.submitting.set(false)
      });
    }
  }

  private populateForm(user: any) {
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      centerId: user.centerId
    });

    // Phone & Region
    if (user.phoneNumber && user.phoneNumber.startsWith('+')) {
      const local = user.phoneNumber.slice(-10);
      const region = user.phoneNumber.slice(0, -10);
      this.form.patchValue({
        phoneNumber: local,
        region: region || '+91'
      }, { emitEvent: false });
    } else if (user.phoneNumber && user.phoneNumber.length > 10) {
      this.form.patchValue({
        phoneNumber: user.phoneNumber.slice(-10),
        region: user.region || '+91'
      }, { emitEvent: false });
    } else {
      this.form.patchValue({
        phoneNumber: user.phoneNumber,
        region: user.region || '+91'
      }, { emitEvent: false });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const formVal = this.form.getRawValue();
    const isRec = formVal.role === 'Receptionist';

    // If update
    if (this.data) {
      // We'll need an update method in UserService
      this.userService.update(this.data.userId, formVal).subscribe({
        next: () => {
          this.notify.success('User updated successfully');
          this.dialogRef.close(true);
        },
        error: () => this.submitting.set(false)
      });
      return;
    }

    // If create
    const request = isRec
      ? this.userService.createReceptionist(formVal)
      : this.userService.createAdmin(formVal);

    request.subscribe({
      next: () => {
        this.notify.success(`${formVal.role} created successfully!`);
        this.dialogRef.close(true);
      },
      error: () => this.submitting.set(false)
    });
  }
}
