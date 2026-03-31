import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TherapiesService } from '../../../core/services/therapies.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { SkillsService, Skill } from '../../../core/services/skills.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Therapy } from '../../../core/models/therapy.model';
import { TherapyCategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-therapy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Therapy' : 'Create Therapy' }}</h2>
    <mat-dialog-content>
      @if (loadingCategories()) {
        <div class="loading-cats">Loading categories...</div>
      } @else {
        <form [formGroup]="form" class="flex-form">
          <mat-form-field appearance="outline">
            <mat-label>Therapy Name</mat-label>
            <input matInput formControlName="therapyName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              @for (cat of categories(); track cat.categoryId) {
                <mat-option [value]="cat.categoryId">{{ cat.categoryName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Duration (mins)</mat-label>
              <input matInput formControlName="durationMinutes" type="number" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Price (INR)</mat-label>
              <input matInput formControlName="price" type="number" />
            </mat-form-field>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Required Room Type</mat-label>
              <mat-select formControlName="requiredRoomType">
                <mat-option value="Standard">Standard</mat-option>
                <mat-option value="Spa Room">Spa Room</mat-option>
                <mat-option value="Hydrotherapy Room">Hydrotherapy Room</mat-option>
                <mat-option value="Physiotherapy Room">Physiotherapy Room</mat-option>
                <mat-option value="Ayurveda Therapy Room">Ayurveda Therapy Room</mat-option>
                <mat-option value="Meditation / Yoga Room">Meditation / Yoga Room</mat-option>
                <mat-option value="Electrotherapy Room">Electrotherapy Room</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Required Skill</mat-label>
              <mat-select formControlName="requiredSkill">
                @for (skill of skills(); track skill.skillId) {
                  <mat-option [value]="skill.skillName">{{ skill.skillName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading() || loadingCategories()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .flex-form { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .loading-cats { padding: 32px; text-align: center; color: #666; }
  `]
})
export class TherapyFormComponent implements OnInit {
  data = inject<Therapy | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<TherapyFormComponent>);
  private fb = inject(FormBuilder);
  private service = inject(TherapiesService);
  private catService = inject(CategoriesService);
  private skillService = inject(SkillsService);
  private notify = inject(NotificationService);

  loading = signal(false);
  loadingCategories = signal(true);
  categories = signal<TherapyCategory[]>([]);
  skills = signal<Skill[]>([]);

  form = this.fb.group({
    therapyName: [this.data?.therapyName || '', Validators.required],
    categoryId: [this.data?.categoryId || null, Validators.required],
    durationMinutes: [this.data?.durationMinutes || 60, [Validators.required, Validators.min(10)]],
    price: [this.data?.price || 0, [Validators.required, Validators.min(0)]],
    requiredRoomType: [this.data?.requiredRoomType || '', Validators.required],
    requiredSkill: [this.data?.requiredSkill || '', Validators.required],
    description: [this.data?.description || '']
  });

  ngOnInit() {
    this.catService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.categories.set(res.data?.data || []);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false)
    });

    this.skillService.getAll().subscribe(res => {
        this.skills.set(res.data || []);
    });

    if (this.data && this.data.therapyId) {
      this.loading.set(true);
      this.service.getById(this.data.therapyId, true).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.data) {
            this.populateForm(res.data);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  private populateForm(therapy: Therapy) {
    this.form.patchValue({
      therapyName: therapy.therapyName,
      categoryId: therapy.categoryId,
      durationMinutes: therapy.durationMinutes,
      price: therapy.price,
      requiredRoomType: therapy.requiredRoomType,
      requiredSkill: therapy.requiredSkill,
      description: therapy.description
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const request = this.data ? this.service.update(this.data.therapyId, this.form.value as any) : this.service.create(this.form.value as any);
    request.subscribe({
      next: () => {
        this.notify.success(`Therapy saved successfully`);
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}
