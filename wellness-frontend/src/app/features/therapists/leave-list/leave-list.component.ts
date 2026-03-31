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
import { NotificationService } from '../../../core/services/notification.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule, MatDialogModule, MatTooltipModule, ReactiveFormsModule, DataTableComponent, HasPermissionDirective, DatePipe],
  template: `
    <div class="page-header">
      <h1 class="font-display text-3xl">Therapist Leaves</h1>
      <button *hasPermission="['Leaves', 'create']" mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Register Leave
      </button>
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
    .actions-cell { display: flex; gap: 4px; }
  `]
})
export class LeaveListComponent implements OnInit {
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;

  private service = inject(LeavesService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  dataSource = new MatTableDataSource<any>([]);
  totalCount = signal(0);
  columns: TableColumn[] = [];

  ngOnInit() {
    this.columns = [
      { key: 'therapistName', label: 'Therapist' },
      { key: 'leaveDate', label: 'Date', template: this.dateTpl },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
      { key: 'actions', label: 'Actions', template: this.actionsTpl }
    ];
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
    this.service.getAll().subscribe({
      next: (res: any) => {

        const rawData = res.data?.data || [];

        // ✅ Transform data here
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

