import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { ReportsService } from '../../core/services/reports.service';
import { CentersService } from '../../core/services/centers.service';
import { NotificationService } from '../../core/services/notification.service';
import { Center } from '../../core/models/center.model';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, 
    MatInputModule, MatIconModule, MatSelectModule, ReactiveFormsModule, 
    BaseChartDirective, MatTableModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-4xl">Analytics Hub</h1>
      <p class="text-secondary text-lg">Performance insights and operational reporting.</p>
    </div>

    <!-- Global Filters -->
    <div class="global-filters">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Center</mat-label>
          <mat-select [formControl]="centerControl" (selectionChange)="reloadData()">
            <mat-option [value]="null">All Centers</mat-option>
            @for (c of centers(); track c.centerId) {
              <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Date filters removed from UI temporarily per user request
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Start Date</mat-label>
          <input matInput [matDatepicker]="startPicker" [formControl]="startDateControl" (dateChange)="reloadData()">
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>End Date</mat-label>
          <input matInput [matDatepicker]="endPicker" [formControl]="endDateControl" (dateChange)="reloadData()">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <button mat-icon-button class="clear-btn" (click)="clearFilters()" color="warn" matTooltip="Clear Filters">
          <mat-icon>clear</mat-icon>
        </button>
        -->
      </div>
    </div>

    <mat-tab-group class="reports-tabs">
      
      <!-- 1. Booking Trends -->
      <mat-tab label="Booking Trends">
        <div class="tab-content">
          <div class="tab-header-actions mb-4">
            <mat-form-field appearance="outline" class="small-select">
              <mat-label>Period</mat-label>
              <mat-select [formControl]="periodControl" (selectionChange)="loadBookingTrends()">
                <mat-option value="daily">Daily</mat-option>
                <mat-option value="weekly">Weekly</mat-option>
                <mat-option value="monthly">Monthly</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Booking Volume Over Time</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                @if(trendsLoading()) { <div class="loading-overlay">Loading...</div> }
                <canvas baseChart [data]="lineChartData()" [options]="lineChartOptions" [type]="'line'"></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- 2. Therapist Utilization -->
      <mat-tab label="Therapist Utilization">
        <div class="tab-content">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Staff Performance Metrics</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if(utilLoading()) { <div class="p-4">Loading data...</div> }
              @else {
                <mat-table [dataSource]="utilDataSource" class="metrics-table">
                  <ng-container matColumnDef="therapist">
                    <mat-header-cell *matHeaderCellDef> Therapist </mat-header-cell>
                    <mat-cell *matCellDef="let row"> {{ row.firstName }} {{ row.lastName }} </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="bookings">
                    <mat-header-cell *matHeaderCellDef> Total Bookings </mat-header-cell>
                    <mat-cell *matCellDef="let row"> {{ row.totalBookings }} </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="minutes">
                    <mat-header-cell *matHeaderCellDef> Total Hours </mat-header-cell>
                    <mat-cell *matCellDef="let row"> {{ (row.totalMinutes / 60) | number:'1.0-1' }} hrs </mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="['therapist', 'bookings', 'minutes']"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: ['therapist', 'bookings', 'minutes'];"></mat-row>
                </mat-table>

                @if(utilDataSource.data.length === 0) {
                  <div class="empty-state">No utilization data found for the selected filters.</div>
                }
              }
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- 3. Peak Times -->
      <mat-tab label="Peak Times">
        <div class="tab-content">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Busiest Hours of the Day</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                @if(peakLoading()) { <div class="loading-overlay">Loading...</div> }
                <canvas baseChart [data]="barChartData()" [options]="barChartOptions" [type]="'bar'"></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- 4. Cancellations & Customers -->
      <mat-tab label="Cancellations & Customers">
        <div class="tab-content">
          <!-- Stats Cards -->
          <div class="metrics-grid mb-6">
            <mat-card class="stat-mini">
              <mat-card-content>
                <span class="label">Total Bookings</span>
                <span class="value">{{ cancelStats()?.totalBookings || 0 }}</span>
              </mat-card-content>
            </mat-card>
            <mat-card class="stat-mini border-red">
              <mat-card-content>
                <span class="label">Cancellations</span>
                <span class="value">{{ cancelStats()?.cancelled || 0 }} <small>({{ cancelStats()?.cancellationRate || '0%' }})</small></span>
              </mat-card-content>
            </mat-card>
            <mat-card class="stat-mini border-orange">
              <mat-card-content>
                <span class="label">No-Shows</span>
                <span class="value">{{ cancelStats()?.noShow || 0 }} <small>({{ cancelStats()?.noShowRate || '0%' }})</small></span>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Customer Lookup -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Customer History Lookup</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="search-bar mt-4">
                <mat-form-field appearance="outline" class="w-full max-w-md">
                  <mat-label>Customer Phone Number</mat-label>
                  <input matInput [formControl]="customerSearch" placeholder="Enter number..." (keyup.enter)="searchCustomer()" />
                  <button mat-icon-button matSuffix (click)="searchCustomer()" color="primary">
                    <mat-icon>search</mat-icon>
                  </button>
                </mat-form-field>
              </div>

              @if (customerHistory().length > 0) {
                <div class="customer-profile mt-4">
                  <h3 class="mb-4">Booking History for {{ customerSearch.value }}</h3>
                  <mat-table [dataSource]="customerHistory()" class="metrics-table">
                    <ng-container matColumnDef="date">
                      <mat-header-cell *matHeaderCellDef> Date & Time </mat-header-cell>
                      <mat-cell *matCellDef="let row"> {{ row.appointmentStartTime | date:'medium' }} </mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="center">
                      <mat-header-cell *matHeaderCellDef> Center </mat-header-cell>
                      <mat-cell *matCellDef="let row"> {{ row.center?.name }} </mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="therapy">
                      <mat-header-cell *matHeaderCellDef> Therapy </mat-header-cell>
                      <mat-cell *matCellDef="let row"> {{ row.therapy?.therapyName }} </mat-cell>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <mat-header-cell *matHeaderCellDef> Status </mat-header-cell>
                      <mat-cell *matCellDef="let row"> 
                        <span class="status-chip" [class]="row.bookingStatus.toLowerCase()">{{ row.bookingStatus }}</span> 
                      </mat-cell>
                    </ng-container>
                    <mat-header-row *matHeaderRowDef="['date', 'center', 'therapy', 'status']"></mat-header-row>
                    <mat-row *matRowDef="let row; columns: ['date', 'center', 'therapy', 'status'];"></mat-row>
                  </mat-table>
                </div>
              } @else if (searching()) {
                <p class="p-4 text-secondary">Searching history...</p>
              } @else if (lastSearch() && customerHistory().length === 0) {
                <p class="p-4 text-secondary">No history found for {{ lastSearch() }}</p>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

    </mat-tab-group>
  `,
  styles: [`
    .page-header { margin-bottom: 16px; border-bottom: 1px solid #E0E0E0; padding-bottom: 12px; }
    .page-header h1 { color: #1E3A38; margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 28px; }
    .text-secondary { color: #666; margin-top: 4px; font-size: 14px; }
    .reports-tabs { min-height: 400px; }
    .tab-content { padding: 16px 0; }
    
    .global-filters { margin-bottom: 12px; }
    .filter-row { display: flex; gap: 16px; align-items: baseline; flex-wrap: wrap; }
    .filter-field { width: 220px; margin-bottom: -16px; } /* Pull bottom up to save space */
    .small-select { width: 150px; margin-bottom: -16px; }
    .clear-btn { margin-top: 8px; }

    .chart-card { border-radius: 8px; border: 1px solid #EAECEE; box-shadow: none; margin-top: 6px; }
    .chart-wrapper { height: 320px; position: relative; padding: 16px; }
    .loading-overlay { position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; z-index: 10; font-weight: 500;}
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-mini { border-left: 4px solid #B48E56; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .stat-mini.border-red { border-left-color: #EF4444; }
    .stat-mini.border-orange { border-left-color: #F59E0B; }
    .stat-mini .label { display: block; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-mini .value { display: block; color: #1E3A38; font-size: 28px; font-weight: 600; font-family: 'Inter', sans-serif; margin-top: 8px; }
    .stat-mini small { font-size: 14px; color: #666; font-weight: 400; }

    .search-bar mat-form-field { width: 100%; max-width: 450px; }
    .metrics-table { width: 100%; border: 1px solid #EAECEE; border-radius: 8px; overflow: hidden; }
    .mat-mdc-header-row { background: #F8F9F9; min-height: 48px !important; }
    .mat-mdc-row { min-height: 48px !important; }
    .empty-state { padding: 32px; text-align: center; color: #888; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mt-4 { margin-top: 16px; }
    .w-full { width: 100%; }

    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-chip.confirmed { background: #EAF4EE; color: #2C5F5D; }
    .status-chip.completed { background: #E0F2FE; color: #0284C7; }
    .status-chip.cancelled { background: #FEE2E2; color: #DC2626; }
    .status-chip.noshow { background: #FEF3C7; color: #D97706; }
    .status-chip.pending { background: #F3F4F6; color: #4B5563; }
  `]
})
export class ReportsComponent implements OnInit {
  private service = inject(ReportsService);
  private centersService = inject(CentersService);
  private notify = inject(NotificationService);

  // Filters
  centerControl = new FormControl<number | null>(null);
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  periodControl = new FormControl<string>('daily');
  centers = signal<Center[]>([]);

  // State
  trendsLoading = signal(false);
  utilLoading = signal(false);
  peakLoading = signal(false);
  searching = signal(false);

  // Data
  utilDataSource = new MatTableDataSource<any>([]);
  cancelStats = signal<any>(null);
  customerSearch = new FormControl('');
  customerHistory = signal<any[]>([]);
  lastSearch = signal<string>('');

  // Charts
  lineChartData = signal<ChartConfiguration['data']>({ datasets: [], labels: [] });
  lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  barChartData = signal<ChartConfiguration['data']>({ datasets: [], labels: [] });
  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  ngOnInit() {
    this.loadCenters();
    this.reloadData(); // Load all data initially
  }

  loadCenters() {
    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
    });
  }

  getFilterParams() {
    const params: any = {};
    if (this.centerControl.value) params.centerId = this.centerControl.value;
    if (this.startDateControl.value) params.startDate = this.startDateControl.value.toISOString();
    if (this.endDateControl.value) params.endDate = this.endDateControl.value.toISOString();
    return params;
  }

  clearFilters() {
    this.centerControl.setValue(null);
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.reloadData();
  }

  reloadData() {
    this.loadBookingTrends();
    this.loadUtilization();
    this.loadPeakTimes();
    this.loadCancelStats();
  }

  loadBookingTrends() {
    this.trendsLoading.set(true);
    const params = { ...this.getFilterParams(), period: this.periodControl.value };
    this.service.getBookingTrends(params).subscribe({
      next: (res) => {
        const rows = res.data || [];
        // Format dates based on period
        const labels = rows.map((r: any) => {
          const d = new Date(r.period);
          if (params.period === 'monthly') return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
          if (params.period === 'weekly') return 'Week of ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });

        this.lineChartData.set({
          labels: labels,
          datasets: [{
            data: rows.map((r: any) => parseInt(r.count, 10)),
            label: 'Bookings',
            backgroundColor: 'rgba(44, 95, 93, 0.2)',
            borderColor: '#2C5F5D',
            pointBackgroundColor: '#2C5F5D',
            fill: 'origin',
            tension: 0.4
          }]
        });
        this.trendsLoading.set(false);
      },
      error: () => this.trendsLoading.set(false)
    });
  }

  loadUtilization() {
    this.utilLoading.set(true);
    this.service.getTherapistUtilization(this.getFilterParams()).subscribe({
      next: (res) => {
        const rows = res.data || [];
        // Sort by total bookings descending
        rows.sort((a: any, b: any) => b.totalBookings - a.totalBookings);
        this.utilDataSource.data = rows;
        this.utilLoading.set(false);
      },
      error: () => this.utilLoading.set(false)
    });
  }

  loadPeakTimes() {
    this.peakLoading.set(true);
    this.service.getPeakTimes(this.getFilterParams()).subscribe({
      next: (res) => {
        const rows = res.data || [];
        this.barChartData.set({
          labels: rows.map((r: any) => {
            const h = parseInt(r.hour, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            return hr + ':00 ' + ampm;
          }),
          datasets: [{
            data: rows.map((r: any) => parseInt(r.count, 10)),
            label: 'Bookings',
            backgroundColor: '#B48E56'
          }]
        });
        this.peakLoading.set(false);
      },
      error: () => this.peakLoading.set(false)
    });
  }

  loadCancelStats() {
    this.service.getCancellations(this.getFilterParams()).subscribe({
      next: (res) => {
        this.cancelStats.set(res.data);
      }
    });
  }

  searchCustomer() {
    const phone = this.customerSearch.value?.trim();
    if (!phone) return;

    this.searching.set(true);
    this.lastSearch.set(phone);
    this.service.getCustomerHistory(phone).subscribe({
      next: (res) => {
        this.customerHistory.set(res.data || []);
        this.searching.set(false);
      },
      error: () => {
        this.customerHistory.set([]);
        this.searching.set(false);
        this.notify.error('Failed to load customer history.');
      }
    });
  }
}
