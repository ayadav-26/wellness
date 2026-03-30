import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BookingsService } from '../../../core/services/bookings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CentersService } from '../../../core/services/centers.service';
import { BookingDetailDialogComponent } from '../booking-detail-dialog/booking-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
    DatePipe,
    RouterModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Bookings</h1>

      <button 
        *hasPermission="['Bookings', 'create']" 
        mat-raised-button 
        color="primary"
        [routerLink]="['/bookings/new']">
        <mat-icon>add</mat-icon> New Booking
      </button>
    </div>

    <div class="filters-bar mb-4">
      <div class="search-group">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search-field">
          <mat-label>Search Bookings</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Customer name or phone..." (keyup.enter)="onSearch()">
          <mat-icon matPrefix>search</mat-icon>
          @if (searchControl.value) {
            <button matSuffix mat-icon-button aria-label="Clear" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
        <button mat-raised-button color="primary" class="rounded-btn" (click)="onSearch()">
          <mat-icon>search</mat-icon> Search
        </button>
      </div>

      <div class="right-filters flex items-center gap-4 ml-auto">

      @if (!isUserRole()) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter-center">
          <mat-label>Center</mat-label>
          <mat-select [formControl]="centerFilter">
            <mat-option [value]="null">All Centers</mat-option>
            @for (center of centers(); track center.centerId) {
              <mat-option [value]="center.centerId">{{ center.name }}</mat-option>
            }
          </mat-select>
          @if (centerFilter.value) {
            <button matSuffix mat-icon-button aria-label="Clear" (click)="centerFilter.setValue(null); $event.stopPropagation()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      }

      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter-status">
        <mat-label>Status</mat-label>
        <mat-select [formControl]="statusFilter">
          <mat-option [value]="null">All Statuses</mat-option>
          <mat-option value="Pending">Pending</mat-option>
          <mat-option value="Rescheduled">Rescheduled</mat-option>
          <mat-option value="Completed">Completed</mat-option>
          <mat-option value="Cancelled">Cancelled</mat-option>
        </mat-select>
        @if (statusFilter.value) {
          <button matSuffix mat-icon-button aria-label="Clear" (click)="statusFilter.setValue(null); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter-date">
        <mat-label>Date</mat-label>
        <input matInput [matDatepicker]="picker" [formControl]="dateFilter">
        @if (dateFilter.value) {
          <button matSuffix mat-icon-button aria-label="Clear" (click)="dateFilter.setValue(null); $event.stopPropagation()">
            <mat-icon>close</mat-icon>
          </button>
        }
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
      </div>
    </div>

    <app-data-table
      [columns]="columns"
      [dataSource]="dataSource"
      [loading]="loading()"
      [totalCount]="totalCount()"
      [pageIndex]="currentPage - 1"
      [pageSize]="currentLimit"
      (pageChange)="onPage($event)"
      emptyMessage="No bookings available.">
    </app-data-table>

    <ng-template #customerTpl let-row="row">
      <button class="customer-link" (click)="openBookingDetail(row)" [disabled]="detailLoading() && activeDetailId() === row.bookingId">
        <span>{{ row.customerName }}</span>
        @if (detailLoading() && activeDetailId() === row.bookingId) {
          <mat-spinner diameter="12" style="display:inline-block"></mat-spinner>
        }
      </button>
    </ng-template>

    <ng-template #statusTpl let-status>
      <app-status-badge [status]="status"></app-status-badge>
    </ng-template>

    <ng-template #priceTpl let-val>
       {{ val | currency:'INR' }}
    </ng-template>

    <ng-template #dateTpl let-val>
      {{ val | date:'short' }}
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="flex gap-2">
        <!-- Common Actions: Cancel & Reschedule -->
        @if (row && ['Pending', 'Confirmed', 'Rescheduled', 'Booked'].includes(row.bookingStatus)) {
           <button mat-icon-button color="warn" matTooltip="Cancel" (click)="onCancel(row)">
             <mat-icon>cancel</mat-icon>
           </button>
           <button mat-icon-button color="accent" matTooltip="Reschedule" (click)="onReschedule(row)">
             <mat-icon>update</mat-icon>
           </button>
        }

        <!-- Admin/Receptionist Actions: Complete -->
        @if (row && canManageStatus() && ['Confirmed', 'Rescheduled', 'Booked', 'Pending'].includes(row.bookingStatus)) {
           <button mat-icon-button class="text-success" matTooltip="Mark as Completed" (click)="onUpdateStatus(row, 'Completed')">
             <mat-icon>check_circle</mat-icon>
           </button>
        }

        <!-- Edit for Administrative Roles -->
        @if (row && !['Cancelled', 'Completed'].includes(row.bookingStatus)) {
          <button *hasPermission="['Bookings', 'edit']" mat-icon-button matTooltip="Edit" [routerLink]="['/bookings', row.bookingId, 'edit']">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; font-family: 'Cormorant Garamond', serif; }
    
    .filters-bar { 
      display: flex; 
      gap: 16px; 
      align-items: center;
      flex-wrap: wrap;
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid #E0E0E0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    
    .filter-center { width: 220px; }
    .filter-status { width: 150px; }
    .filter-date { width: 210px; }
    
    .search-group { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 300px; max-width: 450px; }
    .search-field { width: 100%; max-width: none; flex: 1; }
    .rounded-btn { 
      border-radius: 50px !important; 
      height: 44px; 
      padding: 0 24px; 
      font-weight: 600;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
      overflow: visible !important;
    }
    .rounded-btn mat-icon { 
      margin: 0 !important; 
      font-size: 20px !important; 
      width: 20px !important; 
      height: 20px !important;
      line-height: 20px !important;
      display: block !important;
    }
    .right-filters { display: flex; gap: 16px; margin-left: auto; flex-wrap: wrap; }
    .filter-actions { display: flex; align-items: center; }
    .customer-link {
      /* Reset button styles */
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      font-family: inherit;
      font-size: inherit;
      /* Link look */
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #2C5F5D;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
      &:hover:not([disabled]) { text-decoration: underline; color: #1E3A38; }
      &[disabled] { cursor: default; opacity: 0.7; }
    }
    
    .text-success { color: #2E7D32; }
    .flex { display: flex; align-items: center; }
    .gap-2 { gap: 8px; }
  `]
})
export class BookingListComponent implements OnInit {
  @ViewChild('customerTpl', { static: true }) customerTpl!: TemplateRef<any>;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('priceTpl', { static: true }) priceTpl!: TemplateRef<any>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;

  private service = inject(BookingsService);
  private notify = inject(NotificationService);
  private auth = inject(AuthService);
  private centersService = inject(CentersService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  loading = signal(false);
  detailLoading = signal(false);
  activeDetailId = signal<number | null>(null);
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);

  centers = signal<any[]>([]);

  searchControl = new FormControl('');
  centerFilter = new FormControl<number | null>(null);
  statusFilter = new FormControl<string | null>(null);
  dateFilter = new FormControl<Date | null>(new Date());

  currentPage = 1;
  currentLimit = 10;
  columns: TableColumn[] = [];

  ngOnInit() {
    this.centersService.getAll({ limit: 100 }).subscribe({
      next: (res) => this.centers.set(res.data?.data || [])
    });

    this.columns = [
      { key: 'customerName', label: 'Customer', template: this.customerTpl },
      { key: 'customerPhone', label: 'Phone' },
      { key: 'therapyName', label: 'Therapy' },
      { key: 'appointmentStartTime', label: 'Time', template: this.dateTpl },
      { key: 'bookingStatus', label: 'Status', template: this.statusTpl },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];

    this.loadData();

    this.searchControl.valueChanges.subscribe(val => {
      if (val) {
        const cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
        if (cleaned !== val) {
          this.searchControl.setValue(cleaned, { emitEvent: false });
        }
      }
    });
    this.centerFilter.valueChanges.subscribe(() => { this.currentPage = 1; this.loadData(); });
    this.statusFilter.valueChanges.subscribe(() => { this.currentPage = 1; this.loadData(); });
    this.dateFilter.valueChanges.subscribe(() => { this.currentPage = 1; this.loadData(); });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.onSearch();
  }

  openBookingDetail(row: any) {
    if (this.detailLoading()) return;
    this.detailLoading.set(true);
    this.activeDetailId.set(row.bookingId);

    this.service.getById(row.bookingId).subscribe({
      next: (res) => {
        this.detailLoading.set(false);
        this.activeDetailId.set(null);

        // Flatten therapy fields for the dialog (it reads data.therapyName / data.price)
        const detail = {
          ...res.data,
          therapyName: res.data.therapy?.therapyName || row.therapyName || 'N/A',
          price: res.data.therapy?.price || 0
        };

        const dialogRef = this.dialog.open(BookingDetailDialogComponent, {
          width: '750px',
          maxWidth: '90vw',
          data: detail,
          autoFocus: false
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === 'cancel') {
            this.onCancel(row);
          }
        });
      },
      error: () => {
        this.detailLoading.set(false);
        this.activeDetailId.set(null);
        this.notify.error('Failed to load booking details.');
      }
    });
  }

  loadData() {
    this.loading.set(true);

    const params: any = {
      page: this.currentPage,
      limit: this.currentLimit,
      search: this.searchControl.value ? this.searchControl.value.trim() : ''
    };

    if (this.centerFilter.value) params.centerId = this.centerFilter.value;
    if (this.statusFilter.value) params.bookingStatus = this.statusFilter.value;
    if (this.dateFilter.value) {
      const d = this.dateFilter.value;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      params.date = `${year}-${month}-${day}`;
    }

    this.service.getAll(params).subscribe({
      next: (res) => {
        // Flatten nested objects for simple table display
        const flattened = (res.data?.data || []).map((b: any) => ({
          ...b,
          therapyName: b.therapy?.therapyName || 'N/A',
          price: b.therapy?.price || 0
        }));
        this.dataSource.data = flattened;
        this.totalCount.set(res.data?.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPage(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.currentLimit = event.pageSize;
    this.loadData();
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.centerFilter.setValue(null, { emitEvent: false });
    this.statusFilter.setValue(null, { emitEvent: false });
    this.dateFilter.setValue(null, { emitEvent: false });
    this.currentPage = 1;
    this.loadData();
  }

  canManageStatus(): boolean {
    const role = this.auth.getCurrentUser()?.role;
    return ['Super_Admin', 'Admin', 'Receptionist'].includes(role || '');
  }

  isUserRole(): boolean {
    return this.auth.getCurrentUser()?.role === 'User';
  }

  onCancel(row: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancel Booking',
        message: `Are you sure you want to cancel the booking for ${row.customerName}?`,
        confirmLabel: 'Cancel Booking',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.cancel(row.bookingId).subscribe({
          next: () => {
            this.notify.success('Booking cancelled successfully');
            this.loadData();
          },
          error: (err) => this.notify.error(err?.error?.message || 'Failed to cancel')
        });
      }
    });
  }

  onReschedule(row: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reschedule Booking',
        message: `Do you want to reschedule the booking for ${row.customerName}?`,
        confirmLabel: 'Reschedule',
        confirmColor: 'accent'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.router.navigate(['/bookings', row.bookingId, 'reschedule']);
      }
    });
  }

  onUpdateStatus(row: any, status: string) {
    this.service.updateStatus(row.bookingId, status).subscribe({
      next: () => {
        this.notify.success(`Booking marked as ${status}`);
        this.loadData();
      },
      error: (err) => this.notify.error(err?.error?.message || 'Failed to update status')
    });
  }
}