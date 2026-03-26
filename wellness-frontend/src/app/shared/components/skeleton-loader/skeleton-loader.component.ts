import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [ngClass]="type">
      @for (i of getArray(); track $index) {
        <div class="skeleton-line" [ngClass]="getRowWidthClass($index)"></div>
      }
    </div>
  `,
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() rows = 3;
  @Input() type: 'table' | 'card' | 'list' = 'list';

  getArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  getRowWidthClass(index: number): string {
    if (this.type === 'table') return 'wide';
    if (this.type === 'card' && index === 0) return 'medium';
    return index % 3 === 0 ? 'wide' : (index % 2 === 0 ? 'medium' : 'narrow');
  }
}
