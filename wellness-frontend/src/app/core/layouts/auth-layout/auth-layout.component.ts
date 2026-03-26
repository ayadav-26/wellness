import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      background: #F7F5F2; /* $color-bg overflow fallback */
    }
  `]
})
export class AuthLayoutComponent {}
