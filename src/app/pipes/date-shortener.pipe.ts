import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

const DEFAULT_LOCALE = 'en-US';

@Pipe({
    name: 'dateShortener',
    standalone: true,
})
export class DateShortenerPipe implements PipeTransform {

    transform(value: Date, locale: string = DEFAULT_LOCALE, ..._args: unknown[]): string | null {
        const now = new Date;
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);

        if (!locale) {
            locale = DEFAULT_LOCALE;
        }

        if (!locale.match(/\w{2}(_\w{2})?/gi)) {
            throw new TypeError("locale can't be parsed correctly");
        }

        const dtNow = DateTime.fromJSDate(now);
        const dtValue = DateTime.fromJSDate(value).setLocale(locale);

        const diff = dtNow.diff(dtValue).as('days');

        if (diff < -1 || diff > 1) {
            //return dtValue.toFormat("dd/MM");
            return dtValue.toLocaleString(DateTime.DATE_SHORT);
        }
        return dtValue.toRelativeCalendar();
    }

}
