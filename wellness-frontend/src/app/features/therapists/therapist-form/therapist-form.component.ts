import { Component, inject, signal, OnInit, computed } from '@angular/core';
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

@Component({
  selector: 'app-therapist-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatTabsModule, MatIconModule, MatTooltipModule, MatDividerModule, TimePickerComponent],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Therapist' : 'Add Therapist' }}</h2>
    <mat-dialog-content>
      <mat-tab-group>
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
                <mat-select formControlName="region">
                  <mat-option value="+91">+91</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex: 0.7;">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phoneNumber" maxlength="10" placeholder="10-digit number" />
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
              <p class="text-sm text-muted">Set working hours for each day. You can add multiple slots per day.</p>
              <button mat-icon-button color="primary" type="button" (click)="showDaySelector = true" *ngIf="!showDaySelector" matTooltip="Add Working Day">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px;">add_circle</mat-icon>
              </button>
              
              <div class="day-selector-row" *ngIf="showDaySelector">
                <mat-form-field appearance="outline" class="compact-select">
                  <mat-label>Select Day</mat-label>
                  <mat-select #daySelect>
                    @for (day of availableDays(); track day) {
                      <mat-option [value]="day">{{ day }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-icon-button color="primary" (click)="addNewDay(daySelect.value); showDaySelector = false">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="showDaySelector = false">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </div>
            
            <div class="days-list">
              @for (dayGroup of workingHours.controls; track dayGroup; let i = $index) {
                <div [formGroup]="$any(dayGroup)" class="day-config-row">
                  <div class="day-header">
                    <div class="day-info">
                      <span class="day-name">{{ dayGroup.get('dayOfWeek')?.value }}</span>
                    </div>
                    <button mat-icon-button color="warn" type="button" (click)="removeDay(i)" matTooltip="Remove entire day">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>

                  <div class="day-slots">
                    <div class="slot-edit-row">
                    <div class="time-inputs">
                      <app-time-picker formControlName="start" label="Start"></app-time-picker>
                      <app-time-picker formControlName="end" label="End"></app-time-picker>
                    </div>
                    </div>
                  </div>
                </div>
                <mat-divider></mat-divider>
              }
              @if (workingHours.length === 0) {
                <div class="empty-hours">
                  <mat-icon class="large-icon">schedule</mat-icon>
                  <p>No working hours assigned yet.</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .flex-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .p-4 { padding: 16px; }
    .mb-4 { margin-bottom: 16px; }
    .day-config-row { padding: 12px 0; }
    .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .day-name { font-weight: 600; font-size: 14px; width: 100px; color: #1E3A38; }
    .day-slots { display: flex; flex-direction: column; gap: 8px; padding-left: 24px; }
    .slot-edit-row { display: flex; align-items: center; gap: 12px; }
    .time-inputs { display: flex; flex-direction: column; gap: 4px; flex: 1; }

    .text-muted { color: #666; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .text-warn { color: #f44336; }
    .day-info { display: flex; align-items: center; gap: 8px; }
    .actions-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .day-selector-row { display: flex; align-items: center; gap: 8px; }
    .compact-select { width: 150px; }
    .empty-hours { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; }
    .large-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; opacity: 0.3; }
    mat-tab-group { min-height: 400px; }
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
  showDaySelector = false;

  availableDays = computed(() => {
    const used = this.workingHours.value.map((h: any) => h.dayOfWeek);
    return this.days.filter(d => !used.includes(d));
  });

  form = this.fb.group({
    firstName: [this.data?.firstName || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    lastName: [this.data?.lastName || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    gender: [this.data?.gender || 'Female', Validators.required],
    experienceYears: [this.data?.experienceYears || 0, [Validators.required, Validators.min(0)]],
    phoneNumber: [this.data?.phoneNumber || '', [Validators.required, CustomValidators.phoneNumber()]],
    region: [this.data?.region || '+91', Validators.required],
    centerId: [this.data?.centerId || null, Validators.required],
    skillSet: [this.data?.skillSet || [], [Validators.required]],
    workingHours: this.fb.array([])
  });

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  get workingHours() {
    return this.form.get('workingHours') as FormArray;
  }

  addNewDay(day: string) {
    if (!day) return;
    this.addDayConfig(day, '', '');
  }

  removeDay(index: number) {
    this.workingHours.removeAt(index);
  }

  addDayConfig(day: string, start: string = '', end: string = '') {
    const dayGroup = this.fb.group({
      dayOfWeek: [day],
      start: [start, Validators.required],
      end: [end, Validators.required]
    });
    // Insert into correct order based on this.days
    const dayOrder = this.days.indexOf(day);
    let insertIndex = this.workingHours.length;
    for (let i = 0; i < this.workingHours.length; i++) {
        if (this.days.indexOf(this.workingHours.at(i).value.dayOfWeek) > dayOrder) {
            insertIndex = i;
            break;
        }
    }
    this.workingHours.insert(insertIndex, dayGroup);
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
      this.service.getById(this.data.therapistId).subscribe({
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

    // Phone & Region
    if (therapist.phoneNumber && therapist.phoneNumber.startsWith('+')) {
      const local = therapist.phoneNumber.slice(-10);
      const region = therapist.phoneNumber.slice(0, -10);
      this.form.patchValue({
        phoneNumber: local,
        region: region || '+91'
      }, { emitEvent: false });
    } else if (therapist.phoneNumber && therapist.phoneNumber.length > 10) {
        this.form.patchValue({
          phoneNumber: therapist.phoneNumber.slice(-10),
          region: therapist.region || '+91'
        }, { emitEvent: false });
    } else {
        this.form.patchValue({
          phoneNumber: therapist.phoneNumber,
          region: therapist.region || '+91'
        }, { emitEvent: false });
    }

    // Working Hours
    this.workingHours.clear();
    if (therapist.workingHours) {
      this.days.forEach(day => {
        const existing = therapist.workingHours.find((h: any) => h.dayOfWeek === day);
        if (existing) {
          const firstSlot = existing.slots && existing.slots.length > 0 ? existing.slots[0] : {start: '', end: ''};
          this.addDayConfig(day, firstSlot.start, firstSlot.end);
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
      workingHours: rawValue.workingHours.map((wh: any) => ({
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
