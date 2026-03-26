import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(timeString: string | null | undefined): string {
    if (!timeString) return '';
    // timeString format expected: "HH:mm:ss" or "HH:mm"
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    
    return `${h}:${minutes} ${ampm}`;
  }
}
