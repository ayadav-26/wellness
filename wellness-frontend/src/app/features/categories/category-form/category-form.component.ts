import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriesService } from '../../../core/services/categories.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TherapyCategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Category' : 'Create Category' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex-form">
        <mat-form-field appearance="outline">
          <mat-label>Category Name</mat-label>
          <input matInput formControlName="categoryName" />
          @if (form.get('categoryName')?.invalid && form.get('categoryName')?.touched) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
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
  styles: [`.flex-form { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }`]
})
export class CategoryFormComponent implements OnInit {
  data = inject<TherapyCategory | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  private fb = inject(FormBuilder);
  private service = inject(CategoriesService);
  private notify = inject(NotificationService);

  loading = signal(false);

  form = this.fb.group({
    categoryName: [this.data?.categoryName || '', Validators.required],
    description: [this.data?.description || '']
  });

  ngOnInit() {
    if (this.data && this.data.categoryId) {
      this.loading.set(true);
      this.service.getById(this.data.categoryId, true).subscribe({
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

  private populateForm(category: TherapyCategory) {
    this.form.patchValue({
      categoryName: category.categoryName,
      description: category.description
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const request = this.data ? this.service.update(this.data.categoryId, this.form.value as any) : this.service.create(this.form.value as any);
    request.subscribe({
      next: () => {
        this.notify.success(`Category saved successfully`);
        this.dialogRef.close(true);
      },
      error: () => this.loading.set(false)
    });
  }
}
