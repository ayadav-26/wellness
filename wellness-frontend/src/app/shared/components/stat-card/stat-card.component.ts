import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon" [style.background]="'rgba(' + color + ', 0.1)'" [style.color]="color">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        @if (trend) {
          <div class="stat-trend" [ngClass]="trendUp ? 'up' : 'down'">
            <mat-icon>{{ trendUp ? 'trending_up' : 'trending_down' }}</mat-icon>
            {{ trend }}
          </div>
        }
      </div>
      <div class="stat-body">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: string;
  @Input() trend?: string;
  @Input() trendUp = true;
  @Input() color = '#2C5F5D'; 
}
