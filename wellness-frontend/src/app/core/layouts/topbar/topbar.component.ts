import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatMenuModule, MatButtonModule, MatBadgeModule, MatDividerModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  toggleSidebar = output<void>();
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
