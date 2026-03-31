import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CenterFormComponent } from '../center-form/center-form.component';
import { CenterDetailsComponent } from '../center-details/center-details.component';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';
import { Center } from '../../../core/models/center.model';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-center-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
    MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Centers</h1>
      <button *hasPermission="['Centers', 'create']" mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add Center
      </button>
    </div>

    <div class="filters-bar mb-4">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by Name, City or Contact</mat-label>
        <input matInput [formControl]="searchControl" placeholder="Enter keyword..." (keyup.enter)="onSearch()">
        <mat-icon matPrefix>search</mat-icon>
        @if (searchControl.value) {
          <button mat-icon-button matSuffix (click)="clearSearch()" aria-label="Clear search">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="onSearch()">
        <mat-icon>search</mat-icon> Search
      </button>
    </div>

    <app-data-table
      [columns]="columns"
      [dataSource]="dataSource"
      [loading]="loading()"
      [totalCount]="totalCount()"
      [pageIndex]="currentPage - 1"
      [pageSize]="currentLimit"
      (pageChange)="onPage($event)"
      emptyMessage="No centers found matching your search.">
    </app-data-table>

    <!-- Center Name clickable template -->
    <ng-template #nameTpl let-value let-row="row">
      <button class="name-link" (click)="viewDetails(row.centerId)" [disabled]="loadingDetails()">
        <span>{{ value }}</span>
        @if (loadingDetails() && activeId() === row.centerId) {
          <mat-spinner diameter="14" class="inline-spinner"></mat-spinner>
        }
      </button>
    </ng-template>

    <ng-template #statusTpl let-status>
      <app-status-badge [status]="status ? 'Active' : 'Inactive'"></app-status-badge>
    </ng-template>

    <ng-template #timeTpl let-value>
      {{ value ? (value | slice:0:5) : 'N/A' }}
    </ng-template>

    <ng-template #daysTpl let-row="row">
      <div class="mini-days-row">
        @for (day of days; track day) {
          <span class="mini-day" 
            [class.active]="row.openDays?.includes(day)"
            [matTooltip]="day">
            {{ day[0] }}
          </span>
        }
      </div>
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <button *hasPermission="['Centers', 'edit']" mat-icon-button color="accent" matTooltip="Edit Center" (click)="openForm(row)">
          <mat-icon>edit</mat-icon>
        </button>
        <button *hasPermission="['Centers', 'delete']" mat-icon-button color="warn" matTooltip="Delete Center" (click)="deleteCenter(row)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; }
    .search-field { width: 100%; max-width: 400px; }
    .filters-bar { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .actions-cell { display: flex; gap: 4px; }

    .name-link {
      background: transparent;
      border: none;
      padding: 0;
      color: #2C5F5D;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      text-align: left;
      white-space: nowrap;
      gap: 8px;
      font-size: 13px;
      text-decoration: underline;
      text-decoration-color: transparent;
      text-underline-offset: 3px;
      transition: color 0.2s, text-decoration-color 0.2s;
      &:hover:not(:disabled) {
        color: #1b5e44;
        text-decoration-color: #1b5e44;
      }
      &:disabled {
        cursor: default;
        opacity: 0.6;
      }
    }

    .mini-days-row {
      display: flex;
      gap: 4px;
    }

    .mini-day {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #F5F5F5;
      color: #CCC;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border: 1px solid #EEE;
    }

    .mini-day.active {
      background: #EAF4EE;
      color: #2C5F5D;
      border-color: #B8D6D4;
    }

    .inline-spinner {
      display: inline-block;
    }
  `]
})
export class CenterListComponent implements OnInit {
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;
  @ViewChild('daysTpl', { static: true }) daysTpl!: TemplateRef<any>;
  @ViewChild('timeTpl', { static: true }) timeTpl!: TemplateRef<any>;

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  private centersService = inject(CentersService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  loadingDetails = signal(false);
  activeId = signal<number | null>(null);
  dataSource = new MatTableDataSource<Center>([]);
  totalCount = signal(0);
  searchControl = new FormControl('');

  currentPage = 1;
  currentLimit = 10;
  columns: TableColumn[] = [];

  ngOnInit() {
    this.columns = [
      { key: 'name', label: 'Center', template: this.nameTpl },
      { key: 'contactNumber', label: 'Contact' },
      { key: 'city', label: 'City' },
      { key: 'openingTime', label: 'Opening Time', template: this.timeTpl },
      { key: 'closingTime', label: 'Closing Time', template: this.timeTpl },
      { key: 'status', label: 'Status', template: this.statusTpl },
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

  loadData() {
    this.loading.set(true);

    const searchValue = this.searchControl.value?.trim();

    const params: any = {
      page: this.currentPage,
      limit: this.currentLimit
    };

    // Only add search if it has value
    if (searchValue) {
      params.search = searchValue;
    }

    this.centersService.getAll(params).subscribe({
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

  openForm(center?: Center) {
    const ref = this.dialog.open(CenterFormComponent, { width: '560px', data: center });
    ref.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  deleteCenter(center: Center) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Center', message: `Are you sure you want to delete ${center.name}?`, confirmLabel: 'Delete', confirmColor: 'warn' }
    });

    ref.afterClosed().subscribe(res => {
      if (res) {
        this.centersService.delete(center.centerId).subscribe(() => {
          this.notify.success('Center deleted successfully');
          this.loadData();
        });
      }
    });
  }

  viewDetails(id: number) {
    if (this.loadingDetails()) return;
    this.loadingDetails.set(true);
    this.activeId.set(id);

    this.centersService.getById(id).subscribe({
      next: (res) => {
        this.loadingDetails.set(false);
        this.activeId.set(null);
        this.dialog.open(CenterDetailsComponent, {
          width: '700px',
          maxWidth: '95vw',
          data: res.data
        });
      },
      error: () => {
        this.loadingDetails.set(false);
        this.activeId.set(null);
        this.notify.error('Failed to load center details. Please try again.');
      }
    });
  }
}
