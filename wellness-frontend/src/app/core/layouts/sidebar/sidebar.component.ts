import { Component, computed, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  toggle = output<void>();

  private auth = inject(AuthService);
  private perm = inject(PermissionService);
  private router = inject(Router);

  user = computed(() => this.auth.getCurrentUser());
  currentUrl = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)),
    { initialValue: { url: this.router.url } as NavigationEnd, requireSync: false }
  );

  navItems = computed(() => {
    const role = this.user()?.role;
    const modules = this.perm.modulePermissions(); // Ensure reactivity to newly loaded modules
    
    if (!role || modules.length === 0) return [];

    const items: { label: string; icon: string; route: string }[] = [];

    if (this.perm.isModuleVisible('Dashboard')) {
      items.push({ label: 'Dashboard', icon: 'dashboard', route: '/dashboard' });
    }
    
    if (this.perm.isModuleVisible('Centers')) {
      items.push({ label: 'Centers', icon: 'storefront', route: '/centers' });
    }

    if (this.perm.isModuleVisible('Categories')) {
      items.push({ label: 'Categories', icon: 'category', route: '/categories' });
    }

    if (this.perm.isModuleVisible('Therapies')) {
      items.push({ label: 'Therapies', icon: 'spa', route: '/therapies' });
    }
    
    if (this.perm.isModuleVisible('Therapists')) {
      items.push({ label: 'Therapists', icon: 'groups', route: '/therapists' });
    }

    if (this.perm.isModuleVisible('Leaves')) {
      items.push({ label: 'Leaves', icon: 'event_busy', route: '/leaves' });
    }
    
    // Kept Rooms & WorkingHours out of sidebar originally?
    if (this.perm.isModuleVisible('WorkingHours')) {
      // items.push({ label: 'Working Hours', icon: 'schedule', route: '/working-hours' });
    }
    
    if (this.perm.isModuleVisible('Bookings')) {
      items.push({ label: 'Bookings', icon: 'calendar_month', route: '/bookings' });
    }

    if (this.perm.isModuleVisible('Reports')) {
      items.push({ label: 'Reports', icon: 'analytics', route: '/reports' });
    }

    if (this.perm.isModuleVisible('UserManagement')) {
      items.push({ label: 'User Management', icon: 'manage_accounts', route: '/user-management' });
    }

    return items;
  });

  isActive(route: string): boolean {
    return this.currentUrl()?.url?.startsWith(route) || false;
  }
}
