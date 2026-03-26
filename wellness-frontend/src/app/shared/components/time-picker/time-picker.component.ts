import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <div class="time-picker-row">
      <mat-form-field appearance="outline">
        <mat-label>{{ label }} (HH)</mat-label>
        <mat-select [formControl]="hour">
          @for (h of hours; track h) { <mat-option [value]="h">{{h}}</mat-option> }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>(MM)</mat-label>
        <mat-select [formControl]="minute">
          @for (m of minutes; track m) { <mat-option [value]="m">{{m}}</mat-option> }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .time-picker-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    :host { display: block; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; } /* Hide subscript to save vertical space in grids */

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

  hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
  minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

  hour = new FormControl('09');
  minute = new FormControl('00');

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    this.hour.valueChanges.subscribe(() => this.updateValue());
    this.minute.valueChanges.subscribe(() => this.updateValue());
  }

  writeValue(value: string): void {
    if (!value) return;
    const parts = value.split(':');
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    
    this.hour.setValue(h.padStart(2, '0'), { emitEvent: false });
    this.minute.setValue(m.padStart(2, '0'), { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private updateValue() {
    const h = this.hour.value || '00';
    const m = this.minute.value || '00';
    const timeStr = `${h}:${m}:00`;
    this.onChange(timeStr);
  }
}
