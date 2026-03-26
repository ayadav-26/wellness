import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationFormat',
  standalone: true
})
export class DurationFormatPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return '';
    if (minutes < 60) return `${minutes} mins`;
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${h} hr${h > 1 ? 's' : ''} ${m} mins`;
  }
}
