import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TherapistFormComponent } from '../therapist-form/therapist-form.component';
import { TherapistDetailComponent } from '../therapist-detail/therapist-detail.component';
import { TherapistsService } from '../../../core/services/therapists.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Center } from '../../../core/models/center.model';

@Component({
  selector: 'app-therapist-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule, MatDialogModule, MatSelectModule, MatTooltipModule, ReactiveFormsModule, DataTableComponent, StatusBadgeComponent, HasPermissionDirective],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Therapists</h1>
      <button *hasPermission="['Therapists', 'create']" mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add Therapist
      </button>
    </div>

    <div class="filters-bar mb-4">
      <div class="search-group">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-label>Search Therapist or Phone Number</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Enter keyword..." (keyup.enter)="onSearch()">
          <mat-icon matPrefix>search</mat-icon>
          @if (searchControl.value) {
            <button mat-icon-button matSuffix (click)="clearSearch()" aria-label="Clear search">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
        <button mat-raised-button color="primary" class="rounded-btn" (click)="onSearch()">
           <mat-icon>search</mat-icon> Search
        </button>
      </div>

      <div class="right-filters">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Center</mat-label>
          <mat-select [formControl]="centerControl">
            <mat-option [value]="null">All Centers</mat-option>
            @for (c of centers(); track c.centerId) {
              <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>storefront</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field status-filter">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusControl">
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
          </mat-select>
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
      emptyMessage="No therapists found.">
    </app-data-table>

    <ng-template #nameTpl let-row="row">
      <a class="name-link" (click)="viewDetail(row)">
        {{ row.firstName }} {{ row.lastName }}
      </a>
    </ng-template>

    <ng-template #statusTpl let-status>
      <app-status-badge [status]="status ? 'Active' : 'Inactive'"></app-status-badge>
    </ng-template>

    <ng-template #centerTpl let-row="row">
      <span class="center-name-tag">
        <mat-icon class="mini-icon">storefront</mat-icon>
        {{ row.center?.name || 'N/A' }}
      </span>
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <button *hasPermission="['Therapists', 'edit']" mat-icon-button color="accent" matTooltip="Edit Therapist" (click)="openForm(row)">
          <mat-icon>edit</mat-icon>
        </button>
        <button *hasPermission="['Therapists', 'delete']" mat-icon-button color="warn" matTooltip="Delete Therapist" (click)="deleteTherapist(row)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; font-family: 'Inter', sans-serif; }
    .filters-bar { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-group { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 450px; }
    .right-filters { display: flex; gap: 16px; margin-left: auto; flex-wrap: wrap; }
    .search-field { width: 100%; }
    .filter-field { width: 250px; }
    .status-filter { width: 140px; }
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
    .name-link { color: #2C5F5D; font-weight: 500; cursor: pointer; text-decoration: none; transition: color 0.2s; }
    .name-link:hover { color: #C9A96E; text-decoration: underline; }

    .center-name-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
      background: #F8F9F9;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #EAECEE;
    }

    .mini-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #2C5F5D;
    }
  `]
})
export class TherapistListComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('centerTpl', { static: true }) centerTpl!: TemplateRef<any>;

  private service = inject(TherapistsService);
  private centersService = inject(CentersService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  searchControl = new FormControl('');
  centerControl = new FormControl<number | null>(null);
  statusControl = new FormControl<string>('active');
  centers = signal<Center[]>([]);

  currentPage = 1;
  currentLimit = 10;
  columns: TableColumn[] = [];

  ngOnInit() {
    this.columns = [
      { key: 'name', label: 'Name', template: this.nameTpl },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'gender', label: 'Gender' },
      { key: 'experienceYears', label: 'Experience (Yrs)' },
      { key: 'status', label: 'Status', template: this.statusTpl },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];
    this.loadData();
    this.loadCenters();

    this.searchControl.valueChanges.subscribe(val => {
      if (val) {
        const cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
        if (cleaned !== val) {
          this.searchControl.setValue(cleaned, { emitEvent: false });
        }
      }
    });

    // Center filter
    this.centerControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    // Status filter
    this.statusControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.currentPage = 1;
    this.loadData();
  }

  loadCenters() {
    this.centersService.getAll({ limit: 100 }).subscribe(res => {
      this.centers.set(res.data?.data || []);
    });
  }

  loadData() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage,
      limit: this.currentLimit,
      search: this.searchControl.value ? this.searchControl.value.trim() : ''
    };

    if (this.centerControl.value) {
      params.centerId = this.centerControl.value;
    }

    // Pass includeInactive to allow fetching all if admin
    params.includeInactive = true;

    if (this.statusControl.value === 'active') {
      params.status = true;
    } else if (this.statusControl.value === 'inactive') {
      params.status = false;
    }

    this.service.getAll(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.data?.data || [];
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

  openForm(therapist?: any) {
    const ref = this.dialog.open(TherapistFormComponent, { width: '560px', data: therapist });
    ref.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  viewDetail(therapist: any) {
    this.dialog.open(TherapistDetailComponent, {
      width: '640px',
      data: therapist
    });
  }

  deleteTherapist(therapist: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Therapist', message: `Delete ${therapist.firstName} ${therapist.lastName}?`, confirmLabel: 'Delete', confirmColor: 'warn' }
    });
    ref.afterClosed().subscribe(res => {
      if (res) {
        this.service.delete(therapist.therapistId).subscribe(() => {
          this.notify.success('Deleted successfully');
          this.loadData();
        });
      }
    });
  }
}

