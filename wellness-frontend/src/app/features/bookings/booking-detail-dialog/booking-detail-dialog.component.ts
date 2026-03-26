import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-booking-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="dialog-container">
      <header mat-dialog-title class="flex justify-between items-center bg-slate-50 p-4 border-b">
        <div class="flex items-center gap-3">
          <mat-icon class="text-primary">event_note</mat-icon>
          <div>
            <h2 class="text-xl font-display leading-tight m-0">Booking Details</h2>
            <p class="text-xs text-slate-500 font-sans uppercase tracking-wider mt-1">ID: #{{ data.bookingId }}</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="text-slate-400">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content class="p-6">
        <!-- Status Banner -->
        <div class="status-banner mb-6" [attr.data-status]="data.bookingStatus">
          <span class="label">Current Status:</span>
          <span class="value">{{ data.bookingStatus }}</span>
        </div>

        <div class="grid grid-cols-2 gap-8">
          <!-- Customer Section -->
          <section>
            <h3 class="flex items-center gap-2 text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
              <mat-icon class="text-lg">person</mat-icon> Customer Information
            </h3>
            <div class="detail-group">
              <label>Name</label>
              <p class="font-medium text-slate-800">{{ data.customerName }}</p>
            </div>
            <div class="detail-group">
              <label>Phone Number</label>
              <p class="text-slate-600">{{ data.customerPhone }}</p>
            </div>
            <div class="detail-group">
              <label>Email Address</label>
              <p class="text-slate-600 break-all">{{ data.customerEmail }}</p>
            </div>
          </section>

          <!-- Therapy & Pricing -->
          <section>
            <h3 class="flex items-center gap-2 text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
              <mat-icon class="text-lg">spa</mat-icon> Service & Pricing
            </h3>
            <div class="detail-group highlighted">
              <label>Therapy Selected</label>
              <p class="font-bold text-slate-800">{{ data.therapyName }}</p>
            </div>
            <div class="detail-group">
              <label>Price (Gross)</label>
              <p class="text-xl font-bold text-emerald-600">{{ data.price | currency:'INR' }}</p>
            </div>
            <div class="detail-group">
              <label>Duration</label>
              <p class="text-slate-600">{{ data.therapy?.durationMinutes || 'N/A' }} Minutes</p>
            </div>
          </section>
        </div>

        <mat-divider class="my-6"></mat-divider>

        <div class="grid grid-cols-2 gap-8">
          <!-- Schedule -->
          <section>
            <h3 class="flex items-center gap-2 text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
              <mat-icon class="text-lg">schedule</mat-icon> Schedule & Location
            </h3>
            <div class="detail-group">
              <label>Date & Time</label>
              <p class="font-medium text-slate-800">{{ data.appointmentStartTime | date:'medium' }}</p>
            </div>
            <div class="detail-group">
              <label>Wellness Center</label>
              <p class="text-slate-600">{{ data.center?.name }} - {{ data.center?.city }}</p>
            </div>
          </section>

          <!-- Assignments -->
          <section>
            <h3 class="flex items-center gap-2 text-primary font-semibold mb-4 text-sm uppercase tracking-wide">
              <mat-icon class="text-lg">meeting_room</mat-icon> Assignments
            </h3>
            <div class="detail-group">
              <label>Assigned Room</label>
              <p class="text-slate-600">{{ data.room?.roomName || 'Not Assigned' }} ({{ data.room?.roomType || 'N/A' }})</p>
            </div>
            <div class="detail-group">
              <label>Assigned Therapist</label>
              <p class="font-medium text-slate-800">
                @if (data.therapist) {
                  {{ data.therapist.firstName }} {{ data.therapist.lastName }}
                } @else {
                  <span class="text-amber-600 italic">Pending Assignment</span>
                }
              </p>
            </div>
            <div class="detail-group">
              <label>Therapist Preference</label>
              <p class="text-slate-600">{{ data.therapistGenderPreference }} preferred</p>
            </div>
          </section>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="p-4 border-t bg-slate-50 gap-2">
        <button mat-button mat-dialog-close>Close</button>

        @if (['Pending', 'Confirmed', 'Rescheduled', 'Booked'].includes(data.bookingStatus)) {
          <button *hasPermission="['Bookings', 'delete']" mat-stroked-button color="warn" [mat-dialog-close]="'cancel'">
            <mat-icon>cancel</mat-icon> Cancel Booking
          </button>
        }

        <button *hasPermission="['Bookings', 'edit']" mat-raised-button color="primary" [routerLink]="['/bookings', data.bookingId, 'edit']" mat-dialog-close>
          <mat-icon>edit</mat-icon> Edit Booking
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { width: 100%; overflow: hidden; }
    .status-banner {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: 8px; font-weight: 500;
      &[data-status="Booked"] { background: #E3F2FD; color: #1565C0; }
      &[data-status="Completed"] { background: #E8F5E9; color: #2E7D32; }
      &[data-status="Cancelled"] { background: #FFEBEE; color: #C62828; }
      &[data-status="Pending"] { background: #FFF3E0; color: #EF6C00; }
    }
    .detail-group {
      margin-bottom: 16px;
      label { display: block; font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 600; margin-bottom: 2px; }
      &.highlighted p { color: #1E3A38; font-size: 1.1rem; }
    }
    .text-primary { color: #2C5F5D; }
    .mr-2 { margin-right: 8px; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-8 { gap: 32px; }
    .p-4 { padding: 16px; }
    .p-6 { padding: 24px; }
    .mb-6 { margin-bottom: 24px; }
    .mt-1 { margin-top: 4px; }
    .m-0 { margin: 0; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .font-display { font-family: 'Cormorant Garamond', serif; }
    .font-sans { font-family: system-ui, -apple-system, sans-serif; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-wide { letter-spacing: 0.025em; }
    .bg-slate-50 { background-color: #f8fafc; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .my-6 { margin-top: 24px; margin-bottom: 24px; }
  `]
})
export class BookingDetailDialogComponent {
  data = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<BookingDetailDialogComponent>);
}
