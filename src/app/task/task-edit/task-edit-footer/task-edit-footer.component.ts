import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
    selector: 'app-task-edit-footer',
    standalone: true,
    imports: [
        ButtonModule,
        
    ],
    templateUrl: './task-edit-footer.component.html',
    styleUrl: './task-edit-footer.component.scss'
})
export class TaskEditFooterComponent {
    constructor(
        public ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
    ) {
        console.log("Footer Data: ", config.data);
    }

    closeDialog(data: any) {
        this.ref.close(data);
    }

    submitForm() {
        console.log("Vamos submeter o formulário");
        this.config.data.saveSubject$.next();
    }
}
