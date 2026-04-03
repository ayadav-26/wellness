import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="dialog-header">
      <div class="header-content">
        <div class="avatar-container">
          @if (user.profileImageUrl) {
            <img [src]="user.profileImageUrl" alt="Profile" class="header-avatar-img" />
          } @else {
            <div class="header-avatar-initials">
              {{ (user.firstName?.[0] || '') + (user.lastName?.[0] || '') }}
            </div>
          }
        </div>
        <div class="header-text">
          <div class="header-title-row">
            <h2 mat-dialog-title>{{ user.firstName }} {{ user.lastName }}</h2>
            <span class="role-badge" [ngClass]="user.role?.toLowerCase()">
              {{ user.role }}
            </span>
          </div>
          <div class="header-subtitle">{{ user.email }}</div>
        </div>
      </div>
      <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Account Info Section -->
      <div class="section-card">
        <div class="section-header">
          <mat-icon class="section-icon info-icon">person_outline</mat-icon>
          <h3>Account Information</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <mat-icon class="field-icon">email</mat-icon>
            <div>
              <span class="field-label">Email Address</span>
              <span class="field-value">{{ user.email }}</span>
            </div>
          </div>
          <div class="info-item">
            <mat-icon class="field-icon">phone</mat-icon>
            <div>
              <span class="field-label">Phone Number</span>
              <span class="field-value">{{ user.region || '+91' }} {{ user.phoneNumber || 'N/A' }}</span>
            </div>
          </div>
          @if (user.center) {
            <div class="info-item full-width">
              <mat-icon class="field-icon">storefront</mat-icon>
              <div>
                <span class="field-label">Assigned Center</span>
                <span class="field-value">{{ user.center.name }}</span>
              </div>
            </div>
          } @else {
            <div class="info-item full-width">
              <mat-icon class="field-icon">public</mat-icon>
              <div>
                <span class="field-label">Access Level</span>
                <span class="field-value">Global / All Centers</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Additional Metadata (Optional) -->
      @if (user.createdAt) {
        <div class="metadata-row">
          <span class="meta-label">Member Since:</span>
          <span class="meta-value">{{ user.createdAt | date:'mediumDate' }}</span>
        </div>
      }
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
      align-items: center;
      padding: 12px 18px;
      background: linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%);
      border-bottom: 1px solid #e0dbff;
      min-height: 88px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .avatar-container {
      flex-shrink: 0;
    }

    .header-avatar-img {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(103, 58, 183, 0.2);
    }

    .header-avatar-initials {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #673ab7, #512da8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(103, 58, 183, 0.2);
    }

    .header-text {
      min-width: 0;
      flex: 1;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .role-badge { 
      padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-badge.admin { background: #e3f2fd; color: #1976d2; }
    .role-badge.receptionist { background: #f3e5f5; color: #7b1fa2; }
    .role-badge.super_admin { background: #fff3e0; color: #ef6c00; }

    .close-btn { color: #888; }

    .dialog-content {
      padding: 16px 18px !important;
      max-height: 60vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-card {
      border: 1px solid #efeff5;
      border-radius: 12px;
      padding: 14px;
      background: #fafaff;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #444;
      }
    }

    .section-icon { font-size: 18px; width: 18px; height: 18px; }
    .info-icon { color: #673ab7; }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
    }

    .field-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
      flex-shrink: 0;
    }

    .field-label {
      display: block;
      font-size: 10px;
      color: #999;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 1px;
    }

    .field-value {
      display: block;
      font-size: 13px;
      color: #222;
      font-weight: 500;
    }

    .metadata-row {
      display: flex;
      justify-content: center;
      gap: 6px;
      padding-top: 8px;
      font-size: 11px;
      color: #aaa;
    }

    .meta-value { color: #888; font-weight: 500; }

    mat-dialog-actions {
      padding: 12px 18px 16px;
      border-top: 1px solid #efefef;
    }
  `]
})
export class UserDetailsComponent {
  user = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserDetailsComponent>);
}
