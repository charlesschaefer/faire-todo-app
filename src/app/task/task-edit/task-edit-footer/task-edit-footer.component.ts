import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-task-edit-footer',
    standalone: true,
    imports: [
        ButtonModule,
        TranslocoModule,
    ],
    templateUrl: './task-edit-footer.component.html',
    styleUrl: './task-edit-footer.component.scss'
})
export class TaskEditFooterComponent {
    constructor(
        public ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
    ) {}

    closeDialog(data: any) {
        this.ref.close(data);
    }

    submitForm() {
        this.config.data.saveSubject$.next();
    }
}
