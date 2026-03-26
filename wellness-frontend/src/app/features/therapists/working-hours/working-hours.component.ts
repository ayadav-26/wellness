import { Component, inject, signal, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkingHoursService } from '../../../core/services/working-hours.service';
import { TherapistsService } from '../../../core/services/therapists.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TimePickerComponent } from '../../../shared/components/time-picker/time-picker.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormArray } from '@angular/forms';

@Component({
  selector: 'app-working-hours',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatInputModule, 
    MatSelectModule, 
    MatIconModule, 
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DataTableComponent,
    TimePickerComponent
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Staff Working Hours</h1>
      <p class="text-muted">Manage therapist schedules across centers.</p>
    </div>
    
    <div class="grid-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ editingId() ? 'Update' : 'Add' }} Working Hours</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" class="hours-form">
            
            <!-- Center Selection -->
            <mat-form-field appearance="outline">
              <mat-label>Center</mat-label>
              <mat-select formControlName="centerId" (selectionChange)="onCenterChange()">
                @for (c of centers(); track c.centerId) {
                  <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Therapist Selection -->
            <mat-form-field appearance="outline">
              <mat-label>Therapist</mat-label>
              <mat-select formControlName="therapistId" (selectionChange)="onTherapistChange()">
                @if (loadingTherapists()) {
                  <mat-option disabled>Loading therapists...</mat-option>
                }
                @for (t of therapists(); track t.therapistId) {
                  <mat-option [value]="t.therapistId">{{ t.firstName }} {{ t.lastName }}</mat-option>
                }
                @if (therapists().length === 0 && !loadingTherapists()) {
                  <mat-option disabled>No therapists in this center</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Day of Week (Multiple Selection for Add) -->
            <mat-form-field appearance="outline">
              <mat-label>Day(s) of Week</mat-label>
              <mat-select formControlName="dayOfWeek" [multiple]="!editingId()">
                @for (day of days; track day) {
                  <mat-option [value]="day">{{ day }}</mat-option>
                }
              </mat-select>
              @if (!editingId()) {
                <mat-hint>Select one or more days</mat-hint>
              }
            </mat-form-field>

            <div class="time-section">
              <div class="section-header">
                <label class="section-label">Time Slots</label>
                <button mat-icon-button color="primary" type="button" (click)="addSlot()" matTooltip="Add another slot">
                  <mat-icon>add_circle</mat-icon>
                </button>
              </div>
              
              <div formArrayName="slots" class="slots-container">
                @for (slot of slots.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="slot-row">
                    <div class="time-inputs">
                      <app-time-picker formControlName="start" label="Start"></app-time-picker>
                      <app-time-picker formControlName="end" label="End"></app-time-picker>
                    </div>
                    @if (slots.length > 1) {
                      <button mat-icon-button color="warn" type="button" (click)="removeSlot(i)">
                        <mat-icon>remove_circle</mat-icon>
                      </button>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="form-actions">
              @if (editingId()) {
                <button mat-button type="button" (click)="resetForm()">Cancel</button>
              }
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()" (click)="submit()">
                @if (submitting()) { <mat-spinner diameter="18"></mat-spinner> } @else { {{ editingId() ? 'Update' : 'Add' }} Hours }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="table-container">
        <app-data-table
          [columns]="columns"
          [dataSource]="dataSource"
          [loading]="loading()"
          [totalCount]="totalCount()"
          emptyMessage="Select a therapist to view their working hours.">
        </app-data-table>
      </div>
    </div>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <button mat-icon-button color="accent" matTooltip="Edit Hours" (click)="editRow(row)">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button color="warn" matTooltip="Delete Hours" (click)="deleteRow(row)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </ng-template>

    <ng-template #slotsTpl let-row="row">
      <div class="slots-badge-container">
        @for (s of row.slots; track s) {
          <span class="slot-badge">{{ s.start }} - {{ s.end }}</span>
        }
        @if (!row.slots?.length) {
          <span class="text-muted">No slots</span>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #1E3A38; margin: 0; font-family: 'Inter', sans-serif; }
    .text-muted { color: #666; font-size: 0.9rem; }
    .grid-container { display: grid; grid-template-columns: 420px 1fr; gap: 24px; align-items: start; }
    .hours-form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .time-section { display: flex; flex-direction: column; gap: 8px; border: 1px solid #eee; padding: 12px; border-radius: 8px; background: #fafafa; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .section-label { font-size: 13px; font-weight: 600; color: #555; }
    .slots-container { display: flex; flex-direction: column; gap: 12px; }
    .slot-row { display: flex; align-items: flex-end; gap: 8px; padding-bottom: 8px; border-bottom: 1px dashed #eee; }
    .slot-row:last-child { border-bottom: none; padding-bottom: 0; }
    .time-inputs { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .actions-cell { display: flex; gap: 4px; }
    .table-container { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .slots-badge-container { display: flex; flex-wrap: wrap; gap: 4px; }
    .slot-badge { background: #E6F3F2; color: #2C5F5D; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid #B8D6D4; }
  `]
})
export class WorkingHoursComponent implements OnInit {
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: any;
  @ViewChild('slotsTpl', { static: true }) slotsTpl!: any;

  private fb = inject(FormBuilder);
  private service = inject(WorkingHoursService);
  private therapistsService = inject(TherapistsService);
  private centersService = inject(CentersService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  centers = signal<any[]>([]);
  therapists = signal<any[]>([]);
  loading = signal(false);
  loadingTherapists = signal(false);
  submitting = signal(false);
  editingId = signal<number | null>(null);
  
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  columns: TableColumn[] = [];

  form = this.fb.group({
    centerId: [null as number | null, Validators.required],
    therapistId: [null as number | null, Validators.required],
    dayOfWeek: [[] as string[], Validators.required],
    slots: this.fb.array([
      this.fb.group({
        start: ['09:00', Validators.required],
        end: ['17:00', Validators.required]
      })
    ])
  });

  get slots() {
    return this.form.get('slots') as FormArray;
  }

  addSlot(start = '09:00', end = '17:00') {
    this.slots.push(this.fb.group({
      start: [start, Validators.required],
      end: [end, Validators.required]
    }));
  }

  removeSlot(index: number) {
    if (this.slots.length > 1) {
      this.slots.removeAt(index);
    }
  }

  ngOnInit() {
    this.columns = [
      { key: 'dayOfWeek', label: 'Day' },
      { key: 'slots', label: 'Time Slots', template: this.slotsTpl },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];

    // Load initial centers
    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
      if (this.centers().length > 0) {
        // Pre-select first center if none selected
        if (!this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(this.centers()[0].centerId);
          this.onCenterChange();
        }
      }
    });

    // Handle multiple day selection logic for editing
    effect(() => {
      const id = this.editingId();
      if (id) {
        // In edit mode, dayOfWeek should be a single value, not an array
        // but mat-select multiple expects an array.
        // Actually, I'll handle this in editRow
      }
    });
  }

  onCenterChange() {
    const centerId = this.form.get('centerId')?.value;
    if (!centerId) return;

    this.loadingTherapists.set(true);
    this.therapistsService.getAll({ centerId, limit: 100 }).subscribe({
      next: (res) => {
        this.therapists.set(res.data?.data || []);
        this.loadingTherapists.set(false);
        // Reset therapist selection
        this.form.get('therapistId')?.setValue(null);
        this.dataSource.data = [];
        this.totalCount.set(0);
      },
      error: () => this.loadingTherapists.set(false)
    });
  }

  onTherapistChange() {
    this.editingId.set(null);
    this.loadData();
  }

  loadData() {
    const therapistId = this.form.get('therapistId')?.value;
    const centerId = this.form.get('centerId')?.value;
    if (!therapistId || !centerId) return;

    this.loading.set(true);
    this.service.getAll({ therapistId, centerId }).subscribe({
      next: (res: any) => {
        this.dataSource.data = res.data || [];
        this.totalCount.set(this.dataSource.data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const formVal = this.form.value;
    const id = this.editingId();

    const daysRaw = formVal.dayOfWeek;
    let days: string[] = [];
    
    if (Array.isArray(daysRaw)) {
      days = daysRaw;
    } else {
      days = [daysRaw as unknown as string];
    }

    const payload = { 
      centerId: formVal.centerId,
      therapistId: formVal.therapistId,
      dayOfWeek: days,
      slots: formVal.slots 
    };

    const request = id 
      ? this.service.update(id, payload as any)
      : this.service.create(payload as any);

    request.subscribe({
      next: () => {
        this.notify.success(`Working hours ${id ? 'updated' : 'added'}`);
        this.submitting.set(false);
        this.resetForm();
        this.loadData();
      },
      error: () => this.submitting.set(false)
    });
  }

  editRow(row: any) {
    this.editingId.set(row.workingHourId || row.id);
    
    // Clear and refill slots array
    this.slots.clear();
    if (row.slots && Array.isArray(row.slots)) {
      row.slots.forEach((s: any) => this.addSlot(s.start, s.end));
    } else {
      this.addSlot();
    }

    this.form.patchValue({
      centerId: row.centerId,
      therapistId: row.therapistId,
      dayOfWeek: row.dayOfWeek as any
    });
  }

  resetForm() {
    const therapistId = this.form.get('therapistId')?.value;
    const centerId = this.form.get('centerId')?.value;
    this.editingId.set(null);
    this.form.reset({
      centerId,
      therapistId,
      dayOfWeek: []
    });
    this.slots.clear();
    this.addSlot();
  }

  deleteRow(row: any) {
    const id = row.workingHourId || row.id;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Hours', message: `Delete working hours for ${row.dayOfWeek}?`, confirmLabel: 'Delete', confirmColor: 'warn' }
    });
    ref.afterClosed().subscribe(res => {
      if (res) {
        this.service.delete(id).subscribe(() => {
          this.notify.success('Deleted successfully');
          this.loadData();
        });
      }
    });
  }
}
