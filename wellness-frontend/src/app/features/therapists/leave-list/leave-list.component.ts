import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LeaveFormComponent } from './leave-form.component';
import { LeavesService } from '../../../core/services/leaves.service';
import { CentersService } from '../../../core/services/centers.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule, MatDialogModule, MatSelectModule, MatTooltipModule, ReactiveFormsModule, DataTableComponent, HasPermissionDirective, DatePipe],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Therapist Leaves</h1>
      <button *hasPermission="['Leaves', 'create']" mat-raised-button color="primary" (click)="openForm()" class="bg-white rounded-btn">
        <mat-icon>add</mat-icon> Register Leave
      </button>
    </div>

    <div class="filters-bar mb-4">
      <div class="search-group">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-label>Search Therapist Name</mat-label>
          <input matInput [formControl]="searchControl" (keyup.enter)="loadData()">
        </mat-form-field>
        <button mat-raised-button color="primary" class="rounded-btn search-btn" (click)="loadData()" matTooltip="Search">
           <mat-icon>search</mat-icon> 
        </button>
      </div>

      @if (!isReceptionist()) {
        <div class="right-filters">
          <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
            <mat-label>Filter by Center</mat-label>
            <mat-select [formControl]="centerFilter">
              <mat-option [value]="null">All Centers</mat-option>
              @for (c of centers(); track c.centerId) {
                <mat-option [value]="c.centerId">{{ c.name }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>storefront</mat-icon>
          </mat-form-field>
        </div>
      }
    </div>

    <app-data-table
      [columns]="columns"
      [dataSource]="dataSource"
      [loading]="loading()"
      [totalCount]="totalCount()"
      emptyMessage="No leaves registered.">
    </app-data-table>

    <ng-template #dateTpl let-date>
      {{ date | date:'mediumDate' }}
    </ng-template>

    <ng-template #actionsTpl let-row="row">
      <div class="actions-cell">
        <button *hasPermission="['Leaves', 'delete']" mat-icon-button color="warn" matTooltip="Delete Leave" (click)="deleteLeave(row)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1A1A1A; margin: 0; }
    .bg-white { 
      background-color: #fff !important; 
      color: #2C5F5D !important; 
      border: 1px solid #d1d1d1 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }
    .rounded-btn { 
      border-radius: 50px !important; 
      height: 44px; 
      padding: 0 24px; 
      font-weight: 600;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .filters-bar { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-group { display: flex; gap: 12px; align-items: center; flex: 1; min-width: 300px; max-width: 500px; }
    .search-field { 
      flex: 1;
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #fff !important;
      }
    }
    .right-filters { display: flex; gap: 16px; margin-left: auto; align-items: center; }
    .filter-field { 
      width: 240px; 
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #fff !important;
      }
    }
    .search-btn {
      min-width: 52px !important;
      width: 52px !important;
      padding: 0 !important;
      border-radius: 8px !important;
      background-color: #2C5F5D !important;
      color: #fff !important;
      mat-icon { margin: 0 !important; font-size: 20px !important; width: 20px !important; height: 20px !important; }
    }
    .actions-cell { display: flex; gap: 4px; }
  `]
})
export class LeaveListComponent implements OnInit {
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;

  private service = inject(LeavesService);
  private centersService = inject(CentersService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  columns: TableColumn[] = [];

  centers = signal<any[]>([]);
  searchControl = new FormControl('');
  centerFilter = new FormControl<number | null>(null);

  isReceptionist = () => this.auth.currentUser()?.role === 'Receptionist';

  ngOnInit() {
    this.columns = [
      { key: 'therapistName', label: 'Therapist' },
      { key: 'leaveDate', label: 'Date', template: this.dateTpl },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];

    if (!this.isReceptionist()) {
      this.centersService.getAll({ limit: 100 }).subscribe(res => {
        this.centers.set(res.data?.data || []);
      });
    }

    this.centerFilter.valueChanges.subscribe(() => this.loadData());
    this.loadData();
  }

  // loadData() {
  //   this.loading.set(true);
  //   this.service.getAll().subscribe({
  //     next: (res: any) => {
  //       this.dataSource.data = res.data?.data || [];
  //       this.totalCount.set(res.data?.pagination?.total || 0);
  //       this.loading.set(false);
  //     },
  //     error: () => this.loading.set(false)
  //   });
  // }

  loadData() {
    this.loading.set(true);
    const params: any = {
      search: this.searchControl.value || '',
      centerId: this.centerFilter.value || ''
    };

    this.service.getAll(params).subscribe({
      next: (res: any) => {
        const rawData = res.data?.data || [];
        const formattedData = rawData.map((item: any) => ({
          ...item,
          therapistName: item.therapist
            ? `${item.therapist.firstName} ${item.therapist.lastName}`
            : ''
        }));

        this.dataSource.data = formattedData;
        this.totalCount.set(res.data?.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openForm() {
    const ref = this.dialog.open(LeaveFormComponent, { width: '480px' });
    ref.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  deleteLeave(leave: any) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Leave', message: `Cancel leave registration?`, confirmLabel: 'Delete', confirmColor: 'warn' }
    });
    ref.afterClosed().subscribe(res => {
      if (res) {
        this.service.delete(leave.leaveId).subscribe(() => {
          this.notify.success('Leave deleted');
          this.loadData();
        });
      }
    });
  }
}

