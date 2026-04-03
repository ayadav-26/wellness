import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { CentersService } from '../../core/services/centers.service';
import { AuthService } from '../../core/services/auth.service';
import { Center } from '../../core/models/center.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    StatCardComponent,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private centersService = inject(CentersService);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  centers = signal<Center[]>([]);
  selectedCenterId = signal<number | null>(null);
  userRole = signal<string | null>(null);

  stats = signal<DashboardStats>({
    bookingsToday: 0,
    activeTherapists: 0,
    cancellationsToday: 0,
    weeklyTrend: [],
    upcomingToday: []
  });

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Bookings', backgroundColor: '#2C5F5D', borderRadius: 4 }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} bookings`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Days',
          font: { size: 12, weight: 600 },
          color: '#666',
          padding: { top: 10 }
        }
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        title: {
          display: true,
          text: 'Bookings',
          font: { size: 12, weight: 600 },
          color: '#666',
          padding: { bottom: 10 }
        }
      }
    }
  };

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userRole.set(user?.role || null);

    if (['Super_Admin', 'Admin'].includes(user?.role || '')) {
      this.loadCenters();
    }
    
    this.loadDashboard();
  }

  loadCenters() {
    this.centersService.getAll({ limit: 100, status: true }).subscribe({
      next: (res) => this.centers.set(res.data?.data || []),
      error: () => console.error('Failed to load centers')
    });
  }

  onCenterChange(centerId: number | null) {
    this.selectedCenterId.set(centerId);
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getStats(this.selectedCenterId() || undefined).subscribe({
      next: (res) => {
        const data = res.data;
        this.stats.set(data);

        // Update chart with live weekly trend
        this.barChartData = {
          labels: data.weeklyTrend.map(t => t.day),
          datasets: [
            {
              data: data.weeklyTrend.map(t => t.count),
              label: 'Bookings',
              backgroundColor: '#2C5F5D',
              borderRadius: 4
            }
          ]
        };

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard data.');
        this.loading.set(false);
      }
    });
  }
}
