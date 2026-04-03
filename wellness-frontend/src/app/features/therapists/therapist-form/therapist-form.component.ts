import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TherapistsService } from '../../../core/services/therapists.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../core/validators/custom.validators';
import { SkillsService, Skill } from '../../../core/services/skills.service';
import { Center } from '../../../core/models/center.model';
import { FormArray } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TimePickerComponent } from '../../../shared/components/time-picker/time-picker.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-therapist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatTabsModule, MatIconModule, MatTooltipModule, MatDividerModule, TimePickerComponent, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title class="font-display">{{ data ? 'Edit Therapist' : 'Add Therapist' }}</h2>
    <mat-dialog-content>
      <mat-tab-group #tabGroup>
        <mat-tab label="General Info">
          <form [formGroup]="form" class="flex-form p-4">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="First Name" maxlength="50" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Last Name" maxlength="50" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="Male">Male</mat-option>
                  <mat-option value="Female">Female</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Experience (Years)</mat-label>
                <input matInput type="number" formControlName="experienceYears" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" style="flex: 0.3;">
                <mat-label>Region</mat-label>
                <input matInput value="+91" readonly tabindex="-1" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex: 0.7;">
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

            <mat-form-field appearance="outline">
              <mat-label>Assigned Center</mat-label>
              <mat-select formControlName="centerId">
                @for (center of centers(); track center.centerId) {
                  <mat-option [value]="center.centerId">{{ center.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Skills</mat-label>
              <mat-select formControlName="skillSet" multiple>
                @for (skill of skillsList(); track skill.skillId) {
                  <mat-option [value]="skill.skillName">{{ skill.skillName }}</mat-option>
                }
              </mat-select>
              <mat-hint>Select required skills from the list</mat-hint>
            </mat-form-field>
          </form>
        </mat-tab>

        <mat-tab label="Working Hours">
          <div class="hours-tab-content p-4">
            <div class="actions-header mb-4">
              <div class="header-text">
                <p class="text-sm font-semibold text-primary">Weekly Schedule</p>
                <p class="text-xs text-muted">Toggle days to set availability.</p>
              </div>
              <div class="header-btns">
                <button mat-stroked-button type="button" class="small-btn" (click)="selectWeekdays()">
                  <mat-icon>calendar_view_week</mat-icon> Mon-Fri
                </button>
              </div>
            </div>
            
            <div class="days-grid">
              @for (dayGroup of workingHours.controls; track dayGroup; let i = $index) {
                <div [formGroup]="$any(dayGroup)" class="day-row" [class.is-inactive]="!dayGroup.get('isActive')?.value">
                  <div class="day-toggle-col">
                    <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
                    <span class="day-label">{{ dayGroup.get('dayOfWeek')?.value }}</span>
                  </div>

                  <div class="day-time-col" *ngIf="dayGroup.get('isActive')?.value">
                    <div class="time-stack">
                      <app-time-picker formControlName="start" label="From"></app-time-picker>
                      <app-time-picker formControlName="end" label="To"></app-time-picker>
                    </div>
                  </div>
                  
                  <div class="day-status-col" *ngIf="!dayGroup.get('isActive')?.value">
                    <span class="off-badge">Off Day</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <!-- Tab 0: General Info -->
      @if (tabGroup.selectedIndex === 0) {
        <button mat-stroked-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" [disabled]="!isGeneralInfoValid()" (click)="tabGroup.selectedIndex = 1">
          Next <mat-icon>arrow_forward</mat-icon>
        </button>
      }

      <!-- Tab 1: Working Hours -->
      @if (tabGroup.selectedIndex === 1) {
        <button mat-stroked-button (click)="tabGroup.selectedIndex = 0">
           <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="flex-spacer"></div>
        <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
          @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .flex-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .p-4 { padding: 16px; }
    .mb-4 { margin-bottom: 20px; }
    
    .actions-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 12px; }
    .header-btns { display: flex; gap: 8px; }
    .small-btn { height: 32px !important; font-size: 12px !important; line-height: 32px !important; padding: 0 12px !important; border-radius: 6px !important; .mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; } }

    .days-grid { display: flex; flex-direction: column; gap: 8px; }
    .day-row { display: flex; align-items: center; padding: 10px 16px; background: #f9f9f9; border-radius: 12px; transition: all 0.2s; border: 1px solid transparent; }
    .day-row:hover { background: #fff; border-color: #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .day-row.is-inactive { opacity: 0.6; background: #fafafa; }
    
    .day-toggle-col { display: flex; align-items: center; gap: 12px; width: 160px; }
    .day-label { font-weight: 600; color: #2C5F5D; font-size: 14px; }
    
    .day-time-col { flex: 1; animation: fadeIn 0.3s ease; }
    .time-stack { display: flex; flex-direction: column; gap: 8px; }
    
    .day-status-col { flex: 1; display: flex; justify-content: center; }
    .off-badge { background: #eee; color: #888; font-size: 11px; padding: 2px 10px; border-radius: 50px; font-weight: 500; }

    @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

    .text-primary { color: #2C5F5D; }
    .text-muted { color: #666; }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 11px; }
    .font-semibold { font-weight: 600; }
    .flex-spacer { flex: 1; }

    mat-tab-group { min-height: 450px; }

    ::ng-deep app-time-picker {
      .time-picker-container {
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .label { display: block !important; font-size: 10px !important; width: 30px !important; color: #777 !important; }
      .time-card {
        padding: 4px 8px !important;
        background: #fff !important;
        border: 1px solid #eee !important;
        gap: 4px !important;
        border-radius: 8px !important;
      }
      .time-field { width: 65px !important; }
      .ampm-toggle { margin-left: 0 !important; gap: 2px !important; }
      .ampm-toggle button { padding: 4px 8px !important; font-size: 11px !important; }
    }
  `]
})
export class TherapistFormComponent implements OnInit {
  data = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<TherapistFormComponent>);
  private fb = inject(FormBuilder);
  private service = inject(TherapistsService);
  private centersService = inject(CentersService);
  private skillService = inject(SkillsService);
  private notify = inject(NotificationService);

  loading = signal(false);
  centers = signal<Center[]>([]);
  skillsList = signal<Skill[]>([]);



  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  form = this.fb.group({
    firstName: [this.data?.firstName || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    lastName: [this.data?.lastName || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    gender: [this.data?.gender || 'Female', Validators.required],
    experienceYears: [this.data?.experienceYears || 0, [Validators.required, Validators.min(0)]],
    phoneNumber: [this.data?.phoneNumber || '', [Validators.required, CustomValidators.phoneNumber()]],
    region: [this.data?.region || '+91', Validators.required],
    centerId: [this.data?.centerId || null, Validators.required],
    skillSet: [this.data?.skillSet || [], [Validators.required]],
    workingHours: this.fb.array(this.days.map(day => this.createDayGroup(day)))
  });

  createDayGroup(day: string, active = false, start = '09:00', end = '18:00') {
    return this.fb.group({
      dayOfWeek: [day],
      isActive: [active],
      start: [start],
      end: [end]
    });
  }



  get workingHours() {
    return this.form.get('workingHours') as FormArray;
  }

  isGeneralInfoValid(): boolean {
    const controls = ['firstName', 'lastName', 'gender', 'experienceYears', 'phoneNumber', 'centerId', 'skillSet'];
    return controls.every(c => this.form.get(c)?.valid);
  }

  selectWeekdays() {
    this.workingHours.controls.forEach(control => {
      const day = control.get('dayOfWeek')?.value;
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) {
        control.get('isActive')?.setValue(true);
      }
    });
  }



  // Slots methods no longer needed as we use single start/end inputs


  ngOnInit() {
    this.skillService.getAll().subscribe(res => {
      this.skillsList.set(res.data || []);
    });

    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
    });

    if (this.data && this.data.therapistId) {
      this.loading.set(true);
      this.service.getById(this.data.therapistId, true).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.data) {
            this.populateForm(res.data);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  private populateForm(therapist: any) {
    // Basic fields
    this.form.patchValue({
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      gender: therapist.gender || 'Female',
      experienceYears: therapist.experienceYears || 0,
      centerId: therapist.centerId,
      skillSet: therapist.skillSet || []
    });

    // Phone & Region Mapping (Standardizing to 10 digits)
    if (therapist.phoneNumber) {
      this.form.patchValue({
        phoneNumber: therapist.phoneNumber.slice(-10),
        region: '+91'
      }, { emitEvent: false });
    }

    // Working Hours
    // Working Hours Mapping
    if (therapist.workingHours) {
      this.workingHours.controls.forEach(control => {
        const day = control.get('dayOfWeek')?.value;
        const existing = therapist.workingHours.find((h: any) => h.dayOfWeek === day);
        if (existing && existing.slots && existing.slots.length > 0) {
          control.patchValue({
            isActive: true,
            start: existing.slots[0].start,
            end: existing.slots[0].end
          });
        } else {
          control.patchValue({ isActive: false });
        }
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const rawValue = this.form.value as any;

    // Transform back to slots structure for database compatibility if needed, 
    // or update the structure to match the new simple model.
    const payload = {
      ...rawValue,
      region: '+91',
      workingHours: rawValue.workingHours
        .filter((wh: any) => wh.isActive)
        .map((wh: any) => ({
          dayOfWeek: wh.dayOfWeek,
          slots: [{ start: wh.start, end: wh.end }]
        }))
    };

    const request = this.data?.therapistId
      ? this.service.update(this.data.therapistId, payload as any)
      : this.service.create(payload as any);

    request.subscribe({
      next: () => {
        this.notify.success(`Therapist ${this.data ? 'updated' : 'added'} successfully`);
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}
