import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: EventTarget | null): void {
    if (!targetElement) return;
    const clickedInside = this.elementRef.nativeElement.contains(targetElement as Node);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
