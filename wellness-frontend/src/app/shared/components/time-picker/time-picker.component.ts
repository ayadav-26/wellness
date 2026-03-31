import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  template: `
    <div class="time-picker-container">

      <div class="label">{{ label }}</div>

      <div class="time-card">

        <!-- Hour -->
        <mat-form-field appearance="outline" class="time-field">
          <mat-label>HH</mat-label>
          <mat-select [formControl]="hour">
            @for (h of hours; track h) {
              <mat-option [value]="h">{{ h }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <span class="separator">:</span>

        <!-- Minute -->
        <mat-form-field appearance="outline" class="time-field">
          <mat-label>MM</mat-label>
          <mat-select [formControl]="minute">
            @for (m of minutes; track m) {
              <mat-option [value]="m">{{ m }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- AM PM Toggle -->
        <div class="ampm-toggle">
          <button type="button"
                  [class.active]="period === 'AM'"
                  (click)="setPeriod('AM')">
            AM
          </button>
          <button type="button"
                  [class.active]="period === 'PM'"
                  (click)="setPeriod('PM')">
            PM
          </button>
        </div>

      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .time-picker-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      margin-left: 4px;
    }

    .time-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .time-card:hover {
      border-color: #2C5F5D;
      background: #f4f8f7;
    }

    .time-field {
      width: 80px;
    }

    .separator {
      font-size: 18px;
      font-weight: 600;
      color: #666;
    }

    .ampm-toggle {
      display: flex;
      gap: 6px;
      margin-left: 6px;
    }

    .ampm-toggle button {
      border: 1px solid #ddd;
      background: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ampm-toggle button.active {
      background: #2C5F5D;
      color: white;
      border-color: #2C5F5D;
      box-shadow: 0 2px 6px rgba(44, 95, 93, 0.3);
    }

    .ampm-toggle button:hover {
      background: #f1f8f4;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ]
})
export class TimePickerComponent implements OnInit, ControlValueAccessor {

  @Input() label: string = 'Time';

  hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  );

  minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  hour = new FormControl('09');
  minute = new FormControl('00');
  period: 'AM' | 'PM' = 'AM';

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    this.hour.valueChanges.subscribe(() => this.updateValue());
    this.minute.valueChanges.subscribe(() => this.updateValue());
  }

  writeValue(value: string): void {
    if (!value) return;

    const [h, m] = value.split(':');
    let hourNum = parseInt(h, 10);

    this.period = hourNum >= 12 ? 'PM' : 'AM';

    if (hourNum === 0) hourNum = 12;
    else if (hourNum > 12) hourNum -= 12;

    this.hour.setValue(hourNum.toString().padStart(2, '0'), { emitEvent: false });
    this.minute.setValue(m || '00', { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setPeriod(p: 'AM' | 'PM') {
    this.period = p;
    this.updateValue();
  }

  private updateValue() {
    let hourNum = parseInt(this.hour.value || '0', 10);

    if (this.period === 'PM' && hourNum !== 12) hourNum += 12;
    if (this.period === 'AM' && hourNum === 12) hourNum = 0;

    const h = hourNum.toString().padStart(2, '0');
    const m = this.minute.value || '00';

    const timeStr = `${h}:${m}:00`;
    this.onChange(timeStr);
  }
}