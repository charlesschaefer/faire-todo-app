import { Component, Input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { TaskDto } from '../../dto/task-dto';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';


@Component({
    selector: 'app-task',
    standalone: true,
    imports: [
        RadioButtonModule,
        FormsModule,
        ButtonModule,
    ],
    providers: [
        MessageService,
        DialogService,
    ],
    templateUrl: './task.component.html',
    styleUrl: './task.component.scss'
})
export class TaskComponent implements OnDestroy {
    @Input() task!: TaskDto;
    completed!: number;
    dateTimeHandler = DateTime;

    dialogRef: DynamicDialogRef | undefined;

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService,
    ) {

    }

    showTaskEditDialog(task: TaskDto) {
        this.dialogRef = this.dialogService.open(TaskEditComponent, {
            header: $localize `Edit Task`,
            width: '80%',
            height: '80%',
            breakpoints: {
                '500px': '90%',
                '400px': '100%'
            },
            data: {
                task: task,
                saveSubject$: new Subject<any>(),
            },
            templates: {
                footer: TaskEditFooterComponent
            },
        });

        this.dialogRef.onClose.subscribe((data: any) => {
            if (data != undefined) {
                this.task = data as TaskDto;
            }
        });
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
