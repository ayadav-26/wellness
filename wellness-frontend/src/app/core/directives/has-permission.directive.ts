import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private moduleName: string | null = null;
  private actionName: 'view' | 'create' | 'edit' | 'delete' | null = null;
  private isHidden = true;

  @Input()
  set hasPermission(val: [string, 'view' | 'create' | 'edit' | 'delete']) {
    if (Array.isArray(val) && val.length === 2) {
      this.moduleName = val[0];
      this.actionName = val[1];
    }
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate when permissions signal changes
      this.permissionService.modulePermissions();
      this.updateView();
    });
  }

  private updateView() {
    let hasPerm = false;

    if (this.moduleName && this.actionName) {
      hasPerm = this.permissionService.canAction(this.moduleName, this.actionName);
    }

    if (hasPerm && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isHidden = false;
    } else if (!hasPerm && !this.isHidden) {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}
