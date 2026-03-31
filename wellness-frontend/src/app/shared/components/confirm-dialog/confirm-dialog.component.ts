import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <div class="confirm-message-container">
        <p class="confirm-message">{{ data.message }}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button 
             cdkFocusInitial
             [color]="data.confirmColor" 
             [mat-dialog-close]="true">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-message-container {
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .confirm-message {
      margin: 0;
      line-height: 1.5;
      color: #444;
      font-size: 15px;
      text-align: left;
    }
    
    ::ng-deep .mat-mdc-dialog-actions {
      padding: 16px 24px !important;
      gap: 12px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}
