import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CentersService } from '../../../core/services/centers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { CustomValidators } from '../../../core/validators/custom.validators';
import { TimePickerComponent } from '../../../shared/components/time-picker/time-picker.component';
import { Center, Room as RoomModel } from '../../../core/models/center.model';
import { TherapyCategory } from '../../../core/models/category.model';
import { FormArray } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-center-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
    TimePickerComponent
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title class="font-display">{{ data ? 'Edit Center' : 'Create Center' }}</h2>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <mat-tab-group #tabGroup>
        <mat-tab label="General Info">
          <form [formGroup]="form" class="flex-form p-4">
            <!-- (Form contents remain same) -->
            <mat-form-field appearance="outline">
              <mat-label>Center Name</mat-label>
              <input matInput formControlName="name" maxlength="50" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" maxlength="200" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="city" maxlength="50" />
            </mat-form-field>

            <div class="flex-row">
              <mat-form-field appearance="outline" style="flex: 0 0 130px;">
                <mat-label>Region</mat-label>
                <input matInput value="+91" readonly tabindex="-1" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex: 0 0 300px;">
                <mat-label>Contact Number</mat-label>
                <input matInput formControlName="contactNumber" maxlength="10" />
                @if (form.get('contactNumber')?.hasError('required') && (form.get('contactNumber')?.touched || form.get('contactNumber')?.dirty)) {
                  <mat-error>Required</mat-error>
                } @else if (form.get('contactNumber')?.hasError('invalidPhone') && (form.get('contactNumber')?.touched || form.get('contactNumber')?.dirty)) {
                  <mat-error>Invalid 10-digit number</mat-error>
                } @else if (form.get('contactNumber')?.hasError('invalidStart') && (form.get('contactNumber')?.touched || form.get('contactNumber')?.dirty)) {
                  <mat-error>Must start with 6, 7, 8, or 9</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="time-section">
              <label class="section-label">Opening Time</label>
              <app-time-picker formControlName="openingTime"></app-time-picker>
            </div>

            <div class="time-section">
              <label class="section-label">Closing Time</label>
              <app-time-picker formControlName="closingTime"></app-time-picker>
            </div>

            <div class="open-days-section">
              <label class="section-label">Center Open Days</label>
              <div class="days-toggle-row">
                @for (day of daysOfWeek; track day) {
                  <button type="button" 
                    class="day-toggle-btn"
                    [class.active]="isDaySelected(day)"
                    (click)="toggleDay(day)"
                    [matTooltip]="day">
                    {{ day === 'Thursday' ? 'T' : day[0] }}
                    <span class="day-dot" *ngIf="isDaySelected(day)"></span>
                  </button>
                }
              </div>
              <mat-hint class="days-hint">Tap to toggle operational days. Center will be closed on unselected days.</mat-hint>
            </div>

            <mat-divider class="section-divider" />
            <div class="categories-section">
              <div class="categories-header">
                <span class="categories-title">Therapy Categories</span>
              </div>
              <div class="categories-grid">
                @for (cat of categories(); track cat.categoryId) {
                  <label class="category-item" [class.selected]="selectedIds.has(cat.categoryId)">
                    <mat-checkbox [checked]="selectedIds.has(cat.categoryId)" (change)="toggleCategory(cat.categoryId)"></mat-checkbox>
                    <span class="category-name">{{ cat.categoryName }}</span>
                  </label>
                }
              </div>
            </div>
          </form>
        </mat-tab>

        <mat-tab label="Rooms">
          <div class="rooms-tab-content p-4">
            <p class="text-xs text-muted mb-4">Manage therapy rooms within this center. Rooms are required for bookings.</p>

            <div class="rooms-list">
              @for (roomGroup of rooms.controls; track roomGroup; let i = $index) {
                <div [formGroup]="$any(roomGroup)" class="room-card">
                  <div class="room-inputs">
                    <mat-form-field appearance="outline" class="room-field">
                      <mat-label>Room Name</mat-label>
                      <input matInput formControlName="roomName" placeholder="e.g., Room 101" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="room-field">
                      <mat-label>Room Type</mat-label>
                      <mat-select formControlName="roomType">
                        <mat-option value="Standard">Standard</mat-option>
                        <mat-option value="Spa Room">Spa Room</mat-option>
                        <mat-option value="Hydrotherapy Room">Hydrotherapy Room</mat-option>
                        <mat-option value="Physiotherapy Room">Physiotherapy Room</mat-option>
                        <mat-option value="Ayurveda Therapy Room">Ayurveda Therapy Room</mat-option>
                        <mat-option value="Meditation / Yoga Room">Meditation / Yoga Room</mat-option>
                        <mat-option value="Electrotherapy Room">Electrotherapy Room</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <div class="actions-row-only">
                      <button mat-icon-button color="warn" type="button" (click)="removeRoom(i)" matTooltip="Remove room" class="delete-btn">
                        <mat-icon>remove_circle_outline</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              }
              
              <div class="actions-footer mt-4">
                <button mat-button color="primary" type="button" (click)="addRoom()" class="add-room-btn">
                  <mat-icon>add</mat-icon>
                  Add Room
                </button>
              </div>

              @if (rooms.length === 0) {
                <div class="empty-rooms">
                  <mat-icon class="large-icon">meeting_room</mat-icon>
                  <p>No rooms added yet. At least one room is needed for therapist allocation.</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <!-- Back button if on Rooms tab -->
      @if (tabGroup.selectedIndex === 1) {
        <button mat-stroked-button (click)="tabGroup.selectedIndex = 0" matTooltip="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="flex-spacer"></div>
      }
      
      <!-- Tab 0: General Info -->
      @if (tabGroup.selectedIndex === 0) {
        <button mat-stroked-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" 
                [disabled]="!isGeneralInfoValid()" 
                (click)="nextTab(tabGroup)">
          Next
          <mat-icon>arrow_forward</mat-icon>
        </button>
      }

      <!-- Show Save on Tab 1 -->
      @if (tabGroup.selectedIndex === 1) {
        <button mat-raised-button color="primary" 
                [disabled]="form.invalid || rooms.length === 0 || loading()" 
                (click)="submit()">
          @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-right: 8px;
    }
    .dialog-header h2 { margin-bottom: 0 !important; }
    .close-btn { color: #666; }
    .flex-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 16px !important;
    }

    .time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .time-field {
      width: 100%;
    }

    .time-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
    }

    .section-label {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-left: 4px;
    }

    .open-days-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 4px;
    }

    .days-toggle-row {
      display: flex;
      gap: 8px;
      padding: 4px 0;
      flex-wrap: wrap;
      justify-content: center;
    }

    .day-toggle-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1px solid #E0E0E0;
      background: white;
      color: #666;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);

      &:hover {
        border-color: #2C5F5D;
        background: #F4F8F7;
        transform: translateY(-2px);
      }

      &.active {
        background: #2C5F5D;
        color: white;
        border-color: #2C5F5D;
        box-shadow: 0 4px 10px rgba(44, 95, 93, 0.25);
      }
    }

    .day-dot {
      position: absolute;
      bottom: 6px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: white;
      opacity: 0.8;
    }

    .days-hint {
      font-size: 11px;
      color: #999;
      margin-left: 2px;
    }

    .flex-row {
      display: flex;
      gap: 16px;
      align-items: center;
      @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        > mat-form-field {
          flex: 1 1 auto !important;
          width: 100% !important;
        }
      }
    }

    .section-divider {
      margin: 4px 0 8px;
    }

    .categories-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .categories-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .categories-title-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .categories-title {
      font-size: 13px;
      font-weight: 600;
      color: #444;
      letter-spacing: 0.2px;
    }

    .edit-hint {
      font-size: 11px;
      color: #999;
    }

    .selected-count {
      font-size: 11px;
      font-weight: 600;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
    }

    .categories-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      color: #888;
      font-size: 13px;
    }

    .no-categories {
      margin: 0;
      font-size: 13px;
      color: #999;
      padding: 8px 0;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 4px;
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      background: #fafafa;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;

      &.selected {
        background: #f1f8f4;
        border-color: #81c784;
      }

      &:hover {
        border-color: #a5d6a7;
        background: #f5faf6;
      }
    }

    .category-name {
      font-size: 12px;
      font-weight: 500;
      color: #333;
      line-height: 1.3;
    }

    .p-4 { padding: 16px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .text-xs { font-size: 11px; }
    .text-muted { color: #666; }
    
    .rooms-tab-content {
      min-height: 550px;
    }

    .room-card {
      background: #fdfdfd;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .room-inputs {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .room-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .actions-row-only {
      display: flex;
      justify-content: flex-end;
      margin-top: -8px;
    }

    .actions-footer {
      display: flex;
      justify-content: flex-start;
      margin-top: 8px;
    }

    .add-room-btn {
      font-weight: 500;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px dashed #ccc;
      padding: 10px;
      border-radius: 6px;
      background: #fafafa;
      
      mat-icon {
        margin-right: 8px;
      }

      &:hover {
        background: #f5faf6;
        border-color: #81c784;
        color: #2e7d32;
      }
    }

    .empty-rooms { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      padding: 40px; 
      color: #999; 
    }
    
    .large-icon { 
      font-size: 48px; 
      width: 48px; 
      height: 48px; 
      margin-bottom: 8px; 
      opacity: 0.3; 
    }
    
    mat-tab-group { min-height: 550px; }

    mat-dialog-actions {
      display: flex;
      justify-content: flex-end !important;
      gap: 12px;
      padding: 16px 24px !important;
      background: white;
      border-top: 1px solid #eee;
    }
    .flex-spacer { flex: 1; }

    ::ng-deep .mat-mdc-dialog-content {
      padding: 0 !important;
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class CenterFormComponent implements OnInit {
  data = inject<Center | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CenterFormComponent>);
  private fb = inject(FormBuilder);
  private centersService = inject(CentersService);
  private categoriesService = inject(CategoriesService);
  private notify = inject(NotificationService);
  private matDialog = inject(MatDialog);

  loading = signal(false);
  loadingCategories = signal(false);
  categories = signal<TherapyCategory[]>([]);

  // Tracks the current selection
  selectedIds = new Set<number>();
  // Tracks which were already linked at open time (edit mode)
  private initialIds = new Set<number>();

  submitting = signal(false);
  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  form = this.fb.group({
    name: [this.data?.name || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    address: [this.data?.address || '', [Validators.required, Validators.maxLength(200), CustomValidators.noWhitespace()]],
    city: [this.data?.city || '', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    contactNumber: [this.data?.contactNumber || '', [Validators.required, CustomValidators.phoneNumber()]],
    region: [this.data?.region || '+91', Validators.required],
    openingTime: [this.data?.openingTime || '09:00:00', Validators.required],
    closingTime: [this.data?.closingTime || '17:00:00', Validators.required],
    openDays: [this.data?.openDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], Validators.required],
    rooms: this.fb.array([])
  });

  get rooms() {
    return this.form.get('rooms') as FormArray;
  }

  isDaySelected(day: string): boolean {
    const selected = this.form.get('openDays')?.value as string[] || [];
    return selected.includes(day);
  }

  toggleDay(day: string) {
    const control = this.form.get('openDays');
    let selected = [...(control?.value || [])];
    if (selected.includes(day)) {
      selected = selected.filter(d => d !== day);
    } else {
      selected.push(day);
    }
    control?.setValue(selected);
    control?.markAsDirty();
  }

  addRoom(room?: any) {
    this.rooms.push(this.fb.group({
      roomId: [room?.roomId || null],
      roomName: [room?.roomName || '', [Validators.required, Validators.maxLength(50)]],
      roomType: [room?.roomType || 'Standard', Validators.required]
    }));
  }

  removeRoom(index: number) {
    const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Room',
        message: 'Are you sure you want to remove this room?',
        confirmLabel: 'Remove',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.rooms.removeAt(index);
        this.form.markAsDirty();
      }
    });
  }

  isGeneralInfoValid(): boolean {
    const controls = ['name', 'address', 'city', 'contactNumber', 'region', 'openingTime', 'closingTime', 'openDays'];
    return controls.every(c => this.form.get(c)?.valid);
  }

  nextTab(tabGroup: any) {
    if (this.isGeneralInfoValid()) {
      tabGroup.selectedIndex = 1;
    }
  }

  ngOnInit() {
    this.loadCategories();

    if (this.data && (this.data as any).centerId) {
      const centerId = (this.data as any).centerId;
      this.loading.set(true);
      this.centersService.getById(centerId).subscribe({
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

  private populateForm(center: Center) {
    // Basic fields
    this.form.patchValue({
      name: center.name,
      address: center.address,
      city: center.city,
      openingTime: center.openingTime,
      closingTime: center.closingTime
    });

    // Rooms
    this.rooms.clear();
    if (center.rooms?.length) {
      center.rooms.forEach(r => {
        this.rooms.push(this.fb.group({
          roomId: [r.roomId],
          roomName: [r.roomName],
          roomType: [r.roomType || 'Standard']
        }));
      });
    }

    // Categories
    this.selectedIds.clear();
    this.initialIds.clear();
    if (center.therapyCategories?.length) {
      center.therapyCategories.forEach(c => {
        this.selectedIds.add(c.categoryId);
        this.initialIds.add(c.categoryId);
      });
    }

    // Phone & Region
    // Contact Number Mapping (Standardizing to 10 digits)
    if (center.contactNumber) {
      this.form.patchValue({
        contactNumber: center.contactNumber.slice(-10),
        region: '+91'
      }, { emitEvent: false });
    }
  }

  loadCategories() {
    this.loadingCategories.set(true);
    this.categoriesService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.categories.set(res.data?.data || []);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false)
    });
  }

  toggleCategory(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const payload = {
      ...this.form.value,
      region: '+91'
    };

    if (this.data && (this.data as any).centerId) {
      const centerId = (this.data as any).centerId;
      // ── EDIT FLOW ──
      // 1. Update core fields + rooms (nested handled by backend)
      // 2. Diff categories → link added, unlink removed
      this.centersService.update(centerId, payload as any).pipe(
        switchMap(() => {
          const toLink = [...this.selectedIds].filter(id => !this.initialIds.has(id));
          const toUnlink = [...this.initialIds].filter(id => !this.selectedIds.has(id));

          const linkCalls = toLink.map(id => this.centersService.linkCategory(centerId, id));
          const unlinkCalls = toUnlink.map(id => this.centersService.unlinkCategory(centerId, id));
          const allCalls = [...linkCalls, ...unlinkCalls];

          return allCalls.length ? forkJoin(allCalls) : of(null);
        })
      ).subscribe({
        next: () => {
          this.notify.success('Center updated successfully');
          this.dialogRef.close(true);
        },
        error: () => this.loading.set(false)
      });
      return;
    }

    // ── CREATE FLOW ──
    // 1. Create center + rooms (nested handled by backend)
    // 2. Link all selected categories in parallel
    this.centersService.create(payload as any).pipe(
      switchMap((res) => {
        const centerId = res.data?.centerId;
        const ids = Array.from(this.selectedIds);

        if (!centerId || ids.length === 0) return of(res);

        const linkCalls = ids.map(catId => this.centersService.linkCategory(centerId, catId));
        return forkJoin(linkCalls);
      })
    ).subscribe({
      next: () => {
        this.notify.success('Center created successfully');
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}
