import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private show(message: string, panelClass: string, duration = 4000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      horizontalPosition: 'end',
      verticalPosition:   'bottom',
      panelClass: [panelClass],
    });
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'snack-success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'snack-error', duration);
  }

  warning(message: string, duration = 4500): void {
    this.show(message, 'snack-warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'snack-info', duration);
  }
}
