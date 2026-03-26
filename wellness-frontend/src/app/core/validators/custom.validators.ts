import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that the input is not just whitespace and trims it.
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isWhitespace = (control.value || '').trim().length === 0;
      const isValid = !isWhitespace;
      return isValid ? null : { 'whitespace': true };
    };
  }

  /**
   * Validates that the input is exactly 10 digits and numeric.
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value || '';
      const isNumeric = /^\d+$/.test(val);
      const isCorrectLength = val.length === 10;
      return (isNumeric && isCorrectLength) ? null : { 'invalidPhone': true };
    };
  }
}
