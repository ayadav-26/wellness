import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CenterDetail } from '../../../core/models/center.model';

@Component({
  selector: 'app-center-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="header-icon">
          <mat-icon>location_city</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ center.name }}</h2>
          <span class="status-chip" [class.active]="center.status">
            <span class="status-dot"></span>
            {{ center.status ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
      <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">

      <!-- Basic Info -->
      <div class="section-card">
        <div class="section-header">
          <mat-icon class="section-icon info-icon">info_outline</mat-icon>
          <h3>Basic Information</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <mat-icon class="field-icon">place</mat-icon>
            <div>
              <span class="field-label">Address</span>
              <span class="field-value">{{ center.address }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="field-icon">location_on</mat-icon>
            <div>
              <span class="field-label">City</span>
              <span class="field-value">{{ center.city }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="field-icon">phone</mat-icon>
            <div>
              <span class="field-label">Contact Number</span>
              <span class="field-value">{{ center.contactNumber }}</span>
            </div>
          </div>
          <div class="info-item full-width">
            <mat-icon class="field-icon">calendar_today</mat-icon>
            <div>
              <span class="field-label">Operational Days</span>
              <div class="mini-days-row mt-1">
                @for (day of days; track day) {
                  <span class="mini-day" 
                    [class.active]="center.openDays?.includes(day)"
                    [matTooltip]="day">
                    {{ day[0] }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Therapists -->
      <div class="section-card">
        <div class="section-header">
          <mat-icon class="section-icon therapist-icon">person_outline</mat-icon>
          <h3>Therapists
            <span class="count-badge">{{ center.therapists.length }}</span>
          </h3>
        </div>
        @if (center.therapists.length) {
          <div class="list-grid">
            @for (t of center.therapists; track t.therapistId) {
              <div class="list-item">
                <div class="avatar">{{ t.firstName[0] }}{{ t.lastName[0] }}</div>
                <div>
                  <div class="item-name">{{ t.firstName }} {{ t.lastName }}</div>
                  <div class="item-sub">{{ t.specialization || 'General' }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>person_off</mat-icon>
            <span>No therapists available</span>
          </div>
        }
      </div>

      <!-- Rooms -->
      <div class="section-card">
        <div class="section-header">
          <mat-icon class="section-icon room-icon">meeting_room</mat-icon>
          <h3>Rooms
            <span class="count-badge">{{ center.rooms.length }}</span>
          </h3>
        </div>
        @if (center.rooms.length) {
          <div class="chips-grid">
            @for (r of center.rooms; track r.roomId) {
              <div class="room-chip">
                <mat-icon>door_front</mat-icon>
                {{ r.roomName }}
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>sensor_door</mat-icon>
            <span>No rooms available</span>
          </div>
        }
      </div>

      <!-- Therapy Categories -->
      <div class="section-card">
        <div class="section-header">
          <mat-icon class="section-icon category-icon">spa</mat-icon>
          <h3>Therapy Categories
            <span class="count-badge">{{ center.therapyCategories.length }}</span>
          </h3>
        </div>
        @if (center.therapyCategories.length) {
          <div class="chips-grid">
            @for (c of center.therapyCategories; track c.categoryId) {
              <div class="category-chip">
                <mat-icon>local_florist</mat-icon>
                {{ c.categoryName }}
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>category</mat-icon>
            <span>No therapy categories available</span>
          </div>
        }
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 0;
      background: linear-gradient(135deg, #f0f9f6 0%, #e8f5f0 100%);
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4caf8a, #2e7d5e);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(76, 175, 138, 0.3);
      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    h2[mat-dialog-title] {
      margin: 0 0 6px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      background: #ffebee;
      color: #c62828;
      &.active {
        background: #e8f5e9;
        color: #2e7d32;
      }
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .close-btn {
      color: #666;
    }

    .dialog-content {
      padding: 20px 24px !important;
      max-height: 55vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-card {
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 16px;
      background: #fafafa;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .section-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .info-icon { color: #1976d2; }
    .therapist-icon { color: #7b1fa2; }
    .room-icon { color: #e65100; }
    .category-icon { color: #4caf8a; }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #e0e0e0;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      color: #555;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #eeeeee;
    }

    .field-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #888;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .field-label {
      display: block;
      font-size: 11px;
      color: #888;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .field-value {
      display: block;
      font-size: 13px;
      color: #222;
      font-weight: 500;
    }

    .full-width {
      grid-column: span 2;
    }

    .mini-days-row {
      display: flex;
      gap: 6px;
    }

    .mini-day {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #F5F5F5;
      color: #CCC;
      font-size: 11px;
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

    .mt-1 { margin-top: 4px; }

    .list-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #eeeeee;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9c27b0, #7b1fa2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 13px;
      font-weight: 500;
      color: #222;
    }

    .item-sub {
      font-size: 11px;
      color: #888;
      margin-top: 1px;
    }

    .chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .room-chip, .category-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .room-chip {
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ffcc80;
    }

    .category-chip {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 20px;
      color: #bbb;
      font-size: 13px;
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #ddd;
      }
    }

    mat-dialog-actions {
      padding: 12px 24px 16px;
      border-top: 1px solid #eee;
    }
  `]
})
export class CenterDetailsComponent {
  center = inject<CenterDetail>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CenterDetailsComponent>);
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}
