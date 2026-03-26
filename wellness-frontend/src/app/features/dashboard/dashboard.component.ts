import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
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

  loading = signal(true);
  error = signal<string | null>(null);

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
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getStats().subscribe({
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
