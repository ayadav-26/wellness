import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CentersService } from '../../../core/services/centers.service';
import { SearchService } from '../../../core/services/search.service';
import { SlotsService } from '../../../core/services/slots.service';
import { BookingsService } from '../../../core/services/bookings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../core/validators/custom.validators';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-4xl">Reserve Your Sanctuary</h1>
      <p class="text-secondary">Follow the steps below to schedule your wellness therapy.</p>
    </div>

    <mat-stepper [linear]="true" #stepper class="wizard-stepper" (selectionChange)="onStepperSelectionChange($event)">
      <!-- Step 1: Center, Therapy & Preference -->
      <mat-step [stepControl]="step1">
        <ng-template matStepLabel>Select Location & Therapy</ng-template>
        <form [formGroup]="step1" class="step-content">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Wellness Center</mat-label>
              <mat-select formControlName="centerId" (selectionChange)="onCenterChange()">
                @for (center of centers(); track center.centerId) {
                  <mat-option [value]="center.centerId">{{ center.name }} - {{ center.city }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

             <mat-form-field appearance="outline">
              <mat-label>Therapy Service</mat-label>
              <mat-select formControlName="therapyId">
                @for (cat of therapyCategories(); track cat.categoryId) {
                  <mat-optgroup [label]="cat.categoryName">
                    @for (therapy of cat.therapies; track therapy.therapyId) {
                      <mat-option [value]="therapy.therapyId">
                        {{ therapy.therapyName }} ({{ therapy.durationMinutes }} mins) - {{ therapy.price | currency:'INR' }}
                      </mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-select>
              @if (therapiesLoading()) { <mat-hint>Loading therapies...</mat-hint> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Therapist Gender Preference</mat-label>
              <mat-select formControlName="genderPreference">
                <mat-option value="NoPreference">No Preference</mat-option>
                <mat-option value="Male">Male</mat-option>
                <mat-option value="Female">Female</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="stepper-actions">
            <button mat-flat-button color="primary" matStepperNext [disabled]="step1.invalid">Next Step</button>
          </div>
        </form>
      </mat-step>

      <!-- Step 2: Date & Time -->
      <mat-step [stepControl]="step2">
        <ng-template matStepLabel>Choose Date & Time</ng-template>
        <form [formGroup]="step2" class="step-content">
          <div class="date-time-grid">
            <div class="datepicker-container">
              <mat-calendar [minDate]="minDate" [selected]="step2.get('date')?.value" (selectedChange)="onDateChange($event)"></mat-calendar>
            </div>
            <div class="slots-container">
              <div class="slots-header">
                <h3>Available Slots for {{ step2.get('date')?.value | date:'mediumDate' }}</h3>
                <span class="preference-badge">{{ step1.get('genderPreference')?.value }} preferred</span>
              </div>
              
              @if (slotsLoading()) {
                <div class="loading-slots"><mat-spinner diameter="40"></mat-spinner></div>
              } @else if (slots().length > 0) {
                <div class="slots-grid">
                  @for (slot of slots(); track (slot.startTime + slot.therapist.therapistId + slot.room.roomId)) {
                    <div 
                      class="slot-chip" 
                      [class.selected]="step2.get('time')?.value === slot.startTime"
                      (click)="selectSlot(slot.startTime)">
                      <span class="slot-time">{{ slot.startTime | date:'HH:mm' }}</span>
                      @if (slot.therapist) {
                        <span class="slot-therapist">{{ slot.therapist.firstName }} ({{ slot.therapist.gender }})</span>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="no-slots">No slots available for the selected date or preference. Please try another day or change preference.</p>
              }
            </div>
          </div>
          <div class="stepper-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext [disabled]="step2.invalid">Next Step</button>
          </div>
        </form>
      </mat-step>

      <!-- Step 3: Customer Details -->
      <mat-step [stepControl]="step3">
        <ng-template matStepLabel>Your Information</ng-template>
        <form [formGroup]="step3" class="step-content">
          <div class="info-form-container">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Your Name</mat-label>
              <input matInput formControlName="customerName" placeholder="Full Name" maxlength="50" />
              <mat-icon matPrefix class="material-symbols-outlined">person</mat-icon>
            </mat-form-field>

            <div class="phone-row">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="region-field">
                <mat-label>Region</mat-label>
                <mat-select formControlName="region">
                  <mat-option value="+91">+91 (IN)</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="phone-field">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="customerPhone" placeholder="10-digit mobile number" maxlength="10" />
                <mat-icon matPrefix class="material-symbols-outlined">phone</mat-icon>
                @if (step3.get('customerPhone')?.hasError('required') && step3.get('customerPhone')?.touched) {
                  <mat-error>Required</mat-error>
                } @else if (step3.get('customerPhone')?.hasError('invalidPhone')) {
                  <mat-error>Invalid 10-digit number</mat-error>
                } @else if (step3.get('customerPhone')?.hasError('invalidStart')) {
                  <mat-error>Must start with 6, 7, 8, or 9</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Email Address</mat-label>
              <input matInput formControlName="customerEmail" type="email" placeholder="example@gmail.com" maxlength="100" />
              <mat-icon matPrefix class="material-symbols-outlined">mail</mat-icon>
            </mat-form-field>
          </div>
          <div class="stepper-actions flex justify-center mt-8">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button color="primary" matStepperNext [disabled]="step3.invalid">Review Details</button>
          </div>
        </form>
      </mat-step>

      <!-- Step 4: Final Confirmation -->
      <mat-step>
        <ng-template matStepLabel>Confirm & Book</ng-template>
        <div class="step-content confirmation-view">
          <div class="summary-card">
            <h3>Booking Summary</h3>
            <div class="summary-item">
              <span class="label">Center:</span>
              <span class="value">{{ getSelectedCenterName() }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Therapy:</span>
              <span class="value">{{ getSelectedTherapyName() }} ({{ getSelectedTherapyPrice() | currency:'INR' }})</span>
            </div>
             <div class="summary-item">
              <span class="label">Preference:</span>
              <span class="value">{{ step1.get('genderPreference')?.value }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Date & Time:</span>
                <span class="value">{{ step2.get('date')?.value | date:'longDate' }} at {{ step2.get('time')?.value | date:'HH:mm' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Patient Name:</span>
              <span class="value">{{ step3.get('customerName')?.value }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Phone Number:</span>
              <span class="value">{{ step3.get('region')?.value }} {{ step3.get('customerPhone')?.value }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Email Address:</span>
              <span class="value">{{ step3.get('customerEmail')?.value }}</span>
            </div>
          </div>
          <div class="stepper-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" [disabled]="submitting() || step3.invalid || step2.invalid || step1.invalid" (click)="confirmBooking()">
              @if (submitting()) { <mat-spinner diameter="18"></mat-spinner> } @else { Confirm My Booking }
            </button>
          </div>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  styles: [`
    .page-header { margin-bottom: 32px; border-bottom: 1px solid #E0E0E0; padding-bottom: 16px; }
    .page-header h1 { color: #1E3A38; margin: 0; font-family: 'Cormorant Garamond', serif; font-weight: 500; }
    .text-secondary { color: #666; margin-top: 4px; }
    .wizard-stepper { background: transparent; }
    .step-content { padding: 32px 0; max-width: 800px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .full-width { grid-column: span 2; }
    .stepper-actions { margin-top: 32px; display: flex; gap: 16px; }
    .date-time-grid { display: grid; grid-template-columns: 350px 1fr; gap: 40px; }
    
    .slots-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .slots-header h3 { margin: 0; }
    .preference-badge { font-size: 11px; background: #E0F2F1; color: #00796B; padding: 2px 8px; border-radius: 12px; font-weight: 600; }

    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
    .slot-chip { 
      padding: 12px 8px; border: 1px solid #D0D0D0; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 4px;
      &:hover { border-color: #2C5F5D; background: rgba(44, 95, 93, 0.05); }
      &.selected { background: #2C5F5D; color: white; border-color: #2C5F5D; font-weight: 500; }
    }
    .slot-time { font-size: 14px; font-weight: 600; }
    .slot-therapist { font-size: 10px; opacity: 0.8; }

    .summary-card { background: white; border: 1px solid #E0E0E0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .summary-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #F0F0F0; }
    .summary-item:last-child { border-bottom: none; }
    .summary-item .label { color: #888; font-weight: 500; }
    .summary-item .value { color: #1A1A1A; font-weight: 600; text-align: right; }
    .loading-slots { display: flex; justify-content: center; padding: 40px 0; }
    .no-slots { color: #D32F2F; margin-top: 16px; }

    .info-form-container { 
      display: flex; flex-direction: column; gap: 20px; max-width: 500px; margin: 0 auto;
      padding: 0 32px;
    }
    .phone-row { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
    .region-field { width: 130px !important; flex-shrink: 0; }
    .phone-field { flex: 1; }
    .info-form-container > mat-form-field { width: 100%; }
    .mat-icon { font-family: 'Material Symbols Outlined' !important; }
  `]
})
export class BookingWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private centersService = inject(CentersService);
  private searchService = inject(SearchService);
  private slotsService = inject(SlotsService);
  private bookingsService = inject(BookingsService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bookingId = signal<number | null>(null);
  isEditMode = signal(false);

  centers = signal<any[]>([]);
  therapyCategories = signal<any[]>([]);
  slots = signal<any[]>([]);

  centersLoading = signal(false);
  therapiesLoading = signal(false);
  slotsLoading = signal(false);
  submitting = signal(false);
  bookingSuccess = signal<any | null>(null);
  error = signal<string | null>(null);
  minDate = new Date();

  step1 = this.fb.group({
    centerId: [null as number | null, Validators.required],
    therapyId: [null as number | null, Validators.required],
    genderPreference: ['NoPreference', Validators.required]
  });

  step2 = this.fb.group({
    date: [new Date(), Validators.required],
    time: ['', Validators.required]
  });

  step3 = this.fb.group({
    customerName: ['', [Validators.required, Validators.maxLength(50), CustomValidators.noWhitespace()]],
    customerPhone: ['', [Validators.required, CustomValidators.phoneNumber()]],
    region: ['+91', Validators.required],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(100), CustomValidators.noWhitespace()]]
  });

  ngOnInit() {
    // Check for edit/reschedule mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.bookingId.set(+params['id']);
        this.isEditMode.set(true);
        this.loadBookingForEdit(+params['id']);
      }
    });

    this.centersService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.centers.set(res.data?.data || []);
        this.centersLoading.set(false);
      },
      error: () => this.centersLoading.set(false)
    });
  }
  onCenterChange() {
    const centerId = this.step1.get('centerId')?.value;
    if (!centerId) return;

    this.step1.get('therapyId')?.setValue(null);
    this.step2.get('time')?.setValue('');
    this.slots.set([]);

    this.loadTherapiesForCenter(centerId);
  }

  private loadTherapiesForCenter(centerId: number) {
    this.therapiesLoading.set(true);
    this.therapyCategories.set([]);

    this.searchService.searchTherapies({ centerId }).subscribe({
      next: (res) => {
        this.therapyCategories.set(res.data.categories || []);
        this.therapiesLoading.set(false);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to load therapies');
        this.therapiesLoading.set(false);
      }
    });
  }

  onStepperSelectionChange(event: any) {
    if (event.selectedIndex === 1) {
      this.loadSlots();
    }
  }

  onDateChange(date: Date | null) {
    if (!date) return;
    this.step2.get('date')?.setValue(date);
    this.step2.get('time')?.setValue('');
    this.loadSlots();
  }

  loadSlots() {
    const centerId = this.step1.get('centerId')?.value;
    const therapyId = this.step1.get('therapyId')?.value;
    const date = this.step2.get('date')?.value;
    const genderPreference = this.step1.get('genderPreference')?.value;

    if (!centerId || !therapyId || !date) return;

    this.slotsLoading.set(true);
    this.slots.set([]);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    this.slotsService.getAvailableSlots({ centerId, therapyId, date: dateStr, genderPreference }).subscribe({
      next: (res) => {
        this.slots.set(res.data.slots || []);
        this.slotsLoading.set(false);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to load slots');
        this.slotsLoading.set(false);
      }
    });
  }

  selectSlot(time: string) {
    this.step2.get('time')?.setValue(time);
  }

  getSelectedCenterName() {
    const id = this.step1.get('centerId')?.value;
    return this.centers().find(c => c.centerId === id)?.name || '';
  }

  getSelectedTherapyName() {
    const id = this.step1.get('therapyId')?.value;
    for (const cat of this.therapyCategories()) {
      const therapy = cat.therapies?.find((t: any) => t.therapyId === id);
      if (therapy) return therapy.therapyName;
    }
    return '';
  }

  getSelectedTherapyPrice() {
    const id = this.step1.get('therapyId')?.value;
    for (const cat of this.therapyCategories()) {
      const therapy = cat.therapies.find((t: any) => t.therapyId === id);
      if (therapy) return therapy.price;
    }
    return 0;
  }

  loadBookingForEdit(id: number) {
    this.bookingsService.getById(id).subscribe({
      next: (res) => {
        const b = res.data;
        this.step1.patchValue({
          centerId: b.centerId,
          therapyId: b.therapyId,
          genderPreference: b.therapistGenderPreference || 'NoPreference'
        });

        if (b.appointmentStartTime) {
          this.step2.patchValue({
            date: new Date(b.appointmentStartTime),
            time: b.appointmentStartTime
          });
        }

        this.step3.patchValue({
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          region: b.region || '+91',
          customerEmail: b.customerEmail
        });

        // Strip region prefix if it's still joined in customerPhone
        if (b.customerPhone && b.customerPhone.startsWith('+')) {
          this.step3.patchValue({
            customerPhone: b.customerPhone.slice(-10),
            region: b.customerPhone.slice(0, -10)
          });
        }

        // Trigger therapy load without clearing therapyId
        if (b.centerId) {
          this.loadTherapiesForCenter(b.centerId);
        }

        // Load available slots for the selected date/therapy
        this.loadSlots();
      }
    });
  }

  confirmBooking() {
    if (this.submitting() || this.step1.invalid || this.step2.invalid || this.step3.invalid) return;
    this.submitting.set(true);

    const payload = {
      centerId: this.step1.get('centerId')?.value,
      therapyId: this.step1.get('therapyId')?.value,
      appointmentStartTime: this.step2.get('time')?.value, // ISO string directly from slot.startTime
      therapistGenderPreference: this.step1.get('genderPreference')?.value,
      customerName: this.step3.get('customerName')?.value,
      customerPhone: this.step3.get('customerPhone')?.value,
      region: this.step3.get('region')?.value,
      customerEmail: this.step3.get('customerEmail')?.value
    };

    const request = this.isEditMode() && this.bookingId()
      ? this.bookingsService.update(this.bookingId()!, payload as any)
      : this.bookingsService.create(payload as any);

    request.subscribe({
      next: (res) => {
        this.bookingSuccess.set(res.data);
        const msg = this.isEditMode() ? 'Your booking has been rescheduled!' : 'Your healing journey has been scheduled!';
        this.notify.success(msg);
        this.router.navigate(['/bookings']);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to complete action');
        this.submitting.set(false);
      }
    });
  }
}
