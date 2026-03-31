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
   * Restricts numbers starting with 0-5 (must start with 6-9).
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = (control.value || '').toString();
      if (!val) return null; // Let required validator handle empty values

      const isNumeric = /^\d+$/.test(val);
      const isCorrectLength = val.length === 10;
      const startsWithValidDigit = /^[6-9]/.test(val);

      if (!isNumeric || !isCorrectLength) {
        return { 'invalidPhone': true };
      }

      if (!startsWithValidDigit) {
        return { 'invalidStart': true };
      }

      return null;
    };
  }
}
