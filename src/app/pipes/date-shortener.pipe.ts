import { Pipe, PipeTransform } from '@angular/core';
import { DateTime, Duration } from 'luxon';

@Pipe({
  name: 'dateShortener',
  standalone: true,
})
export class DateShortenerPipe implements PipeTransform {

  transform(value: Date, ...args: unknown[]): string | null {
    const now = new Date;
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const dtNow = DateTime.fromJSDate(now);
    const dtValue = DateTime.fromJSDate(value);
    
    const diff = dtNow.diff(dtValue).as('days');
    
    if (diff < -1 || diff > 1) {
      //return dtValue.toFormat("dd/MM");
      return dtValue.toLocaleString(DateTime.DATE_SHORT);
    }
    return dtValue.toRelativeCalendar();
  }

}
