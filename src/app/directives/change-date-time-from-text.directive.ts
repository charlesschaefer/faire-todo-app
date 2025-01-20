import { Directive, HostListener, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import nlp from 'compromise';
import dates, { DatesMethods } from 'compromise-dates';

nlp.plugin(dates);

@Directive({
    selector: '[appChangeDateTimeFromText]',
    standalone: true
})
export class ChangeDateTimeFromTextDirective {

    ptbrTranslations = {
        'ontem': 'yesterday',
        'hoje': 'today',
        'amanhã': 'tomorrow',
        'hora': 'hour',
        'segunda': 'monday',
        'segunda-feira': 'monday',
        'terça': 'tuesday',
        'terça-feira': 'tuesday',
        'quarta': 'wednesday',
        'quarta-feira': 'wednesday',
        'quinta': 'thursday',
        'quinta-feira': 'thursday',
        'sexta': 'friday',
        'sexta-feira': 'friday',
        'sábado': 'saturday',
        'domingo': 'sunday',
        '(12|1[3-9]|2[0-3])h': '$1 pm',
        '(0?[0-9]|1[01])h': '$1 am',
    }

    @Input() appChangeDateTimeFromText!: string;
    @Input() dateComponent: AbstractControl | null = null;
    @Input() timeComponent: AbstractControl | null = null;


    @HostListener('input', ['$event.target.value']) onKeyUp(value: string) {
        this.onValueChange(value);
    }

    onValueChange(value: string) {
        if (this.appChangeDateTimeFromText == 'pt-br') {
            for (const ptbr in this.ptbrTranslations) {
                value = value.replace(new RegExp(ptbr, 'i'), this.ptbrTranslations[ptbr as keyof typeof this.ptbrTranslations])
            }
        }
        const doc = nlp<DatesMethods>(value);
        const dates = doc.dates().get();
        if (dates) {
            const dateView = dates[0] as {start:string};
            if (dateView?.start) {
                const date = new Date(dateView.start);
                this.dateComponent?.patchValue(date);

                if (date.getHours() != 0) {
                    this.timeComponent?.patchValue(date);
                }
            }
        }
    }
}
