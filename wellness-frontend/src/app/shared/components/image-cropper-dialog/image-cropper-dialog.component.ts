import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageCropperComponent, ImageTransform, CropperPosition, LoadedImage } from 'ngx-image-cropper';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface CropDialogData {
  imageFile: File;
}

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    ImageCropperComponent,
  ],
  template: `
    <div class="crop-dialog">
      <div class="crop-dialog-header">
        <mat-icon>crop</mat-icon>
        <span>Adjust Profile Picture</span>
      </div>

      <div class="crop-dialog-body">
        <div class="cropper-wrapper">
          <image-cropper
            [imageFile]="dialogData.imageFile"
            [maintainAspectRatio]="true"
            [aspectRatio]="1"
            [roundCropper]="true"
            [canvasRotation]="0"
            [transform]="transform()"
            format="jpeg"
            outputType="blob"
            (imageCropped)="onImageCropped($event)"
            (imageLoaded)="onImageLoaded()"
            (loadImageFailed)="onLoadFailed()"
            [style.display]="imgLoaded() ? 'block' : 'none'"
          />
          @if (!imgLoaded()) {
            <div class="cropper-loading">
              <mat-spinner diameter="40" />
              <span>Loading image...</span>
            </div>
          }
        </div>

        <div class="zoom-controls">
          <mat-icon class="zoom-icon">zoom_out</mat-icon>
          <input
            type="range"
            class="zoom-slider"
            min="0.5"
            max="3"
            step="0.05"
            [value]="scale()"
            (input)="onZoomChange($event)"
          />
          <mat-icon class="zoom-icon">zoom_in</mat-icon>
          <span class="zoom-value">{{ (scale() * 100) | number:'1.0-0' }}%</span>
        </div>

        <p class="crop-hint">Drag to reposition · Use the slider to zoom</p>
      </div>

      <div class="crop-dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!croppedBlob()">
          <mat-icon>check_circle</mat-icon>
          Confirm
        </button>
      </div>
    </div>
  `,
  styles: [`
    .crop-dialog {
      display: flex;
      flex-direction: column;
      width: 420px;
      max-width: 100%;
    }

    .crop-dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      border-bottom: 1px solid #eee;

      mat-icon {
        color: #673ab7;
      }
    }

    .crop-dialog-body {
      padding: 20px;
    }

    .cropper-wrapper {
      width: 100%;
      height: 300px;
      border-radius: 12px;
      overflow: hidden;
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      image-cropper {
        max-height: 300px;
      }
    }

    .cropper-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 0 4px;

      .zoom-icon {
        color: #666;
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .zoom-slider {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, #673ab7 0%, #673ab7 var(--pct, 0%), #ddd var(--pct, 0%), #ddd 100%);
        border-radius: 2px;
        cursor: pointer;
        outline: none;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #673ab7;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(103, 58, 183, 0.4);
        }
      }

      .zoom-value {
        font-size: 12px;
        color: #666;
        width: 36px;
        text-align: right;
        flex-shrink: 0;
      }
    }

    .crop-hint {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin: 10px 0 0 0;
    }

    .crop-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px;
      border-top: 1px solid #eee;

      button[mat-raised-button] {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `]
})
export class ImageCropperDialogComponent {
  dialogData = inject<CropDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ImageCropperDialogComponent>);

  imgLoaded = signal(false);
  croppedBlob = signal<Blob | null | undefined>(null);
  scale = signal(1);
  transform = signal<ImageTransform>({ scale: 1 });

  onImageLoaded() {
    this.imgLoaded.set(true);
  }

  onImageCropped(event: any) {
    this.croppedBlob.set(event.blob ?? event.base64);
  }

  onLoadFailed() {
    this.dialogRef.close(null);
  }

  onZoomChange(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.scale.set(val);
    this.transform.set({ scale: val });
    // Update slider gradient for visual progress
    const pct = ((val - 0.5) / (3 - 0.5)) * 100;
    (event.target as HTMLElement).style.setProperty('--pct', `${pct}%`);
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  onConfirm() {
    const blob = this.croppedBlob();
    if (blob) {
      this.dialogRef.close(blob);
    }
  }
}
