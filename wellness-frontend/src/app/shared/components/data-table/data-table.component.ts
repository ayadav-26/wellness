import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface TableColumn {
  key: string;
  label: string;
  template?: any;
  formatter?: (row: any) => string;
  /** Inline min-width for this column, e.g. '200px'. Overrides the global 150px default. */
  minWidth?: string;
  /** Pin this column to the left edge (sticky). */
  sticky?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements AfterViewInit {
  @Input() columns: TableColumn[] = [];
  @Input() dataSource = new MatTableDataSource<any>([]);
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() emptyMessage = 'No data available';
  @Input() pageIndex = 0;
  @Input() pageSize = 10;
  
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  get displayedColumns(): string[] {
    return this.columns.map(c => c.key);
  }

  ngAfterViewInit() {
    // If local data (totalCount not provided), attach paginator directly
    this.dataSource.paginator = this.paginator;
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }
}
