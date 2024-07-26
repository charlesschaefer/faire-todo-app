import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { MessageService } from 'primeng/api';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';

import { TaskDto } from '../../dto/task-dto';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskService } from '../../services/task.service';


@Component({
    selector: 'app-task',
    standalone: true,
    imports: [
        RadioButtonModule,
        FormsModule,
        ButtonModule,
        MenuModule,
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
    @Output() onTaskRemoved = new EventEmitter<number>();
    completed!: number;
    dateTimeHandler = DateTime;

    dialogRef: DynamicDialogRef | undefined;

    taskMenuItems = [
        {
            label: $localize `Options`,
            items: [
                {
                    label: $localize `Delete`,
                    icon: 'pi pi-trash',
                    command: () => {
                        this.deleteTask();
                    }
                }
            ]
        }
    ]

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService,
        private taskService: TaskService<TaskDto>,
    ) {}

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

    deleteTask() {
        this.taskService.remove(this.task.id).subscribe({
            complete: () => {
                this.messageService.add({
                    summary: $localize `Removed`,
                    detail: $localize `Task removed successfully`,
                    severity: "success"
                });
                this.onTaskRemoved.emit(this.task.id);
            }, 
            error: (err) => {
                this.messageService.add({
                    summary: $localize `Error`,
                    detail: $localize `Error removing task. ${err}`,
                    severity: "error"
                })
            }
        })
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
