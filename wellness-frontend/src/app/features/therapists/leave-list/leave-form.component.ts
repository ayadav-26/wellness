import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeavesService } from '../../../core/services/leaves.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CustomValidators } from '../../../core/validators/custom.validators';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatInputModule, 
    MatSelectModule, 
    MatDatepickerModule, 
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Register Leave</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex-form">
        @if (!isReceptionist()) {
          <mat-form-field appearance="outline">
            <mat-label>Filter by Center</mat-label>
            <mat-select [formControl]="centerFilter" placeholder="Select Center">
              @for (c of centers(); track c.centerId) {
                <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix style="color: #666; margin-right: 8px;">storefront</mat-icon>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Therapist</mat-label>
          <mat-select formControlName="therapistId">
            @for (t of therapists(); track t.therapistId) {
              <mat-option [value]="t.therapistId">{{ t.firstName }} {{ t.lastName }}</mat-option>
            }
          </mat-select>
          @if (form.get('therapistId')?.invalid && form.get('therapistId')?.touched) {
            <mat-error>Therapist is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Leave Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="leaveDate" (click)="picker.open()" readonly />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.get('leaveDate')?.invalid && form.get('leaveDate')?.touched) {
            <mat-error>Invalid date</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Reason</mat-label>
          <textarea matInput formControlName="reason" rows="3" placeholder="Enter reason for leave" maxlength="200"></textarea>
          @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
            <mat-error>Reason is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Register Leave }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .flex-form { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    mat-form-field { 
      width: 100%; 
    }
  `]
})
export class LeaveFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef<LeaveFormComponent>);
  private fb = inject(FormBuilder);
  private service = inject(LeavesService);
  private therapistsService = inject(TherapistsService);
  private centersService = inject(CentersService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  loading = signal(false);
  therapists = signal<any[]>([]);
  centers = signal<any[]>([]);
  centerFilter = new FormControl<number | null>(null);

  isReceptionist = () => this.auth.currentUser()?.role === 'Receptionist';

  form = this.fb.group({
    therapistId: [null as number | null, Validators.required],
    leaveDate: [new Date(), Validators.required],
    reason: ['', [Validators.required, CustomValidators.noWhitespace()]],
  });

  ngOnInit() {
    if (!this.isReceptionist()) {
      this.centersService.getAll({ limit: 100 }).subscribe(res => {
        this.centers.set(res.data?.data || []);
      });
    }

    this.centerFilter.valueChanges.subscribe((val: number | null) => {
      this.loadTherapists(val);
      this.form.get('therapistId')?.setValue(null);
    });

    this.loadTherapists(this.centerFilter.value);
  }

  loadTherapists(centerId: number | null) {
    if (!centerId) {
      this.therapists.set([]);
      return;
    }
    const params: any = { limit: 100, centerId: centerId };

    this.therapistsService.getAll(params).subscribe(res => {
      this.therapists.set(res.data?.data || []);
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const val = this.form.value;
    const d = val.leaveDate as Date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const payload = {
      ...val,
      leaveDate: `${year}-${month}-${day}`
    };

    this.service.create(payload as any).subscribe({
      next: () => {
        this.notify.success('Leave registered successfully');
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}
