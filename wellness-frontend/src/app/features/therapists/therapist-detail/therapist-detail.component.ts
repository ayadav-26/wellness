import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TherapistsService } from '../../../core/services/therapists.service';
import { WorkingHoursService } from '../../../core/services/working-hours.service';
import { Therapist } from '../../../core/models/therapist.model';

@Component({
  selector: 'app-therapist-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-container">
      <div class="header">
        <h2 mat-dialog-title>Therapist Profile</h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading profile...</p>
          </div>
        } @else if (therapist()) {
          <div class="profile-layout">
            <div class="profile-header">
              <div class="avatar">
                {{ therapist()!.firstName[0] }}{{ therapist()!.lastName[0] }}
              </div>
              <div class="name-info">
                <h3>{{ therapist()!.firstName }} {{ therapist()!.lastName }}</h3>
                <p class="specialization">{{ therapist()!.specialization || 'Therapist' }}</p>
                <span class="status-pill" [class.active]="therapist()?.status">
                  {{ therapist()?.status ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <div class="info-gridStack">
              <div class="info-group">
                <label><mat-icon>person</mat-icon> Personal Details</label>
                <div class="info-item">
                  <span>Gender</span>
                  <strong>{{ therapist()?.gender }}</strong>
                </div>
                <div class="info-item">
                  <span>Experience</span>
                  <strong>{{ therapist()?.experienceYears }} Years</strong>
                </div>
              </div>

              <div class="info-group">
                <label><mat-icon>call</mat-icon> Contact Information</label>
                <div class="info-item">
                  <span>Phone Number</span>
                  <strong>{{ therapist()?.phoneNumber }}</strong>
                </div>
                <div class="info-item">
                  <span>Assigned Center</span>
                  <strong>{{ therapist()?.center?.name || 'N/A' }}</strong>
                </div>
              </div>
            </div>

            <div class="skills-section">
                <label><mat-icon>psychology</mat-icon> Skills</label>
                <div class="skills-list">
                    @for (skill of therapist()?.skillSet || []; track skill) {
                        <span class="skill-tag">{{ skill }}</span>
                    }
                    @if (!therapist()?.skillSet?.length) {
                        <span class="text-muted">No skills listed</span>
                    }
                </div>
            </div>

            <div class="hours-section">
              <label><mat-icon>schedule</mat-icon> Working Hours</label>
              <div class="hours-grid">
                @for (day of days; track day) {
                  <div class="day-row" [class.empty]="!getHoursForDay(day)">
                    <span class="day-name">{{ day }}</span>
                    <div class="slots">
                      @if (getHoursForDay(day)) {
                        @for (slot of getHoursForDay(day)!.slots; track $index) {
                          <span class="slot-time">{{ slot.start }} - {{ slot.end }}</span>
                        }
                      } @else {
                        <span class="off-day">Off Day</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button color="primary" (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .detail-container { min-width: 500px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 16px; padding-right: 8px; }
    .mat-mdc-dialog-title { margin: 0; padding: 16px 24px; font-family: 'Inter', sans-serif; font-weight: 600; }
    button[mat-icon-button] { display: flex !important; align-items: center !important; justify-content: center !important; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 16px; color: #666; }
    
    .profile-layout { display: flex; flex-direction: column; gap: 32px; padding: 16px 0; }
    .profile-header { display: flex; align-items: center; gap: 16px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: #2C5F5D; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; }
    .name-info h3 { margin: 0; font-size: 20px; color: #1A1A1A; }
    .specialization { margin: 4px 0; color: #666; font-size: 14px; }
    .status-pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #eee; color: #666; }
    .status-pill.active { background: #EAF4EE; color: #3A7D5C; }

    .info-gridStack { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .info-group label, .hours-section label, .skills-section label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #2C5F5D; margin-bottom: 12px; }
    .info-group label mat-icon, .hours-section label mat-icon, .skills-section label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
    .info-item span { font-size: 12px; color: #9A9A9A; }
    .info-item strong { font-size: 14px; color: #333; }

    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: #F0EDE8; color: #5A5550; padding: 4px 12px; border-radius: 6px; font-size: 13px; border: 1px solid #E2DDD6; }

    .hours-grid { display: flex; flex-direction: column; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .day-row { display: flex; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #eee; align-items: center; }
    .day-row:last-child { border-bottom: none; }
    .day-row.empty { background: #fafafa; }
    .day-name { font-size: 13px; font-weight: 500; min-width: 80px; }
    .slots { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .slot-time { background: #E6F3F2; color: #2C5F5D; padding: 2px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #B8D6D4; }
    .off-day { font-size: 12px; color: #999; font-style: italic; }
  `]
})
export class TherapistDetailComponent implements OnInit {
  data = inject<any>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<TherapistDetailComponent>);
  private service = inject(TherapistsService);
  private hoursService = inject(WorkingHoursService);

  loading = signal(true);
  therapist = signal<Therapist | null>(null);
  workingHours = signal<any[]>([]);
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const id = this.data.therapistId;
    this.service.getById(id).subscribe(res => {
      if (res.data) {
        this.therapist.set(res.data as Therapist);
        this.loadHours(id);
      } else {
        this.loading.set(false);
      }
    });
  }

  loadHours(therapistId: number) {
    this.hoursService.getAll({ therapistId }).subscribe(res => {
      this.workingHours.set(res.data?.data || []);
      this.loading.set(false);
    });
  }

  getHoursForDay(day: string) {
    return this.workingHours().find(h => h.dayOfWeek === day);
  }

  close() {
    this.dialogRef.close();
  }
}
