import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkillsService, Skill } from '../../../core/services/skills.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-skills-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Skill' : 'Add Skill' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" class="skill-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Skill Name</mat-label>
          <input matInput formControlName="skillName" placeholder="e.g. Ayurveda, Massage" maxlength="50" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .skill-form { margin-top: 8px; }
    .w-full { width: 100%; }
  `]
})
export class SkillsFormComponent implements OnInit {
  data = inject<Skill | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<SkillsFormComponent>);
  private fb = inject(FormBuilder);
  private skillService = inject(SkillsService);
  private notify = inject(NotificationService);

  loading = signal(false);
  form = this.fb.group({
    skillName: [this.data?.skillName || '', [Validators.required, Validators.maxLength(50)]]
  });

  ngOnInit() {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    
    const skillName = this.form.value.skillName!;
    const request = this.data 
      ? this.skillService.update(this.data.skillId, { skillName })
      : this.skillService.create(skillName);

    request.subscribe({
      next: () => {
        this.notify.success(`Skill ${this.data ? 'updated' : 'added'} successfully`);
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}

@Component({
  selector: 'app-skills-manage',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="manage-header">
      <h2 mat-dialog-title>Manage Skills</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add Skill
      </button>
    </div>
    
    <mat-dialog-content>
      @if (loading()) {
        <div class="flex justify-center p-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="skills-list">
          @for (skill of skills(); track skill.skillId) {
            <div class="skill-item">
              <span class="skill-name">{{ skill.skillName }}</span>
              <div class="actions">
                <button mat-icon-button color="accent" (click)="openForm(skill)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteSkill(skill)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <p class="empty-msg">No skills added yet.</p>
          }
        </div>
      }
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .manage-header { display: flex; justify-content: space-between; align-items: center; padding-right: 16px; }
    .skills-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; min-width: 400px; }
    .skill-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid #eee; border-radius: 8px; }
    .skill-name { font-weight: 500; }
    .actions { display: flex; gap: 4px; }
    .empty-msg { text-align: center; padding: 32px; color: #999; }
  `]
})
export class SkillsManageComponent implements OnInit {
  private skillService = inject(SkillsService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  skills = signal<Skill[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.skillService.getAll().subscribe({
      next: (res) => {
        this.skills.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openForm(skill?: Skill) {
    const ref = this.dialog.open(SkillsFormComponent, {
      width: '400px',
      data: skill
    });
    ref.afterClosed().subscribe((res: any) => {
      if (res) this.loadData();
    });
  }

  deleteSkill(skill: Skill) {
      if (confirm(`Are you sure you want to delete ${skill.skillName}?`)) {
          this.skillService.delete(skill.skillId).subscribe(() => {
              this.notify.success('Skill deleted successfully');
              this.loadData();
          });
      }
  }
}
