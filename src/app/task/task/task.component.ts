import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DateTime } from 'luxon';
import { firstValueFrom, Subject } from 'rxjs';

import { TaskDto } from '../../dto/task-dto';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskService } from '../../services/task.service';
import { TranslateService } from '@ngx-translate/core';
import { ProjectDto } from '../../dto/project-dto';


@Component({
    selector: 'app-task',
    standalone: true,
    imports: [
        RadioButtonModule,
        FormsModule,
        ButtonModule,
        MenuModule,
        ConfirmDialogModule,
        CdkDrag,
        CdkDragPlaceholder,
        CheckboxModule,
    ],
    providers: [
        MessageService,
        DialogService,
        ConfirmationService,
    ],
    templateUrl: './task.component.html',
    styleUrl: './task.component.scss'
})
export class TaskComponent implements OnDestroy, OnInit {
    @Input() task!: TaskDto;
    @Input() projects!: Map<number, ProjectDto>;

    @Output() onTaskRemoved = new EventEmitter<number>();
    @Output() onEditTask = new EventEmitter<Event>();

    onSaveEditTask$ = new Subject();

    completed: boolean = false;
    dateTimeHandler = DateTime;

    dialogRef: DynamicDialogRef | undefined;

    taskMenuItems!: MenuItem[];
    
    constructor(
        private dialogService: DialogService,
        private messageService: MessageService,
        private taskService: TaskService<TaskDto>,
        private confirmationService: ConfirmationService,
        private translate: TranslateService,
    ) {
        this.setTaskMenuItems();
    }

    ngOnInit() {
        this.onSaveEditTask$.subscribe(value => {
            this.onEditTask.emit();
        });
        if (this.task.completed) {
            console.log(`Task ${this.task.title} completed`);
            this.completed = true;
        }
    }

    async setTaskMenuItems() {
        this.taskMenuItems = [
            {
                label: await firstValueFrom(this.translate.get(`Options`)),
                items: [
                    {
                        label: await firstValueFrom(this.translate.get(`Delete`)),
                        icon: 'pi pi-trash',
                        command: () => {
                            this.confirmDeleteTask();
                        }
                    } as MenuItem
                ]
            }  as MenuItem
        ]
    }

    async showTaskEditDialog(task: TaskDto) {
        this.dialogRef = this.dialogService.open(TaskEditComponent, {
            header: await firstValueFrom(this.translate.get(`Edit Task`)),
            width: '80%',
            height: '80%',
            breakpoints: {
                '500px': '90%',
                '400px': '100%'
            },
            data: {
                task: task,
                saveSubject$: new Subject(),
                onSaveEditTask$: this.onSaveEditTask$,
            },
            templates: {
                footer: TaskEditFooterComponent
            },
        });

        this.dialogRef.onClose.subscribe((data: TaskDto) => {
            if (data != undefined && data.title != undefined) {
                this.task = data as TaskDto;
            }
        });
    }

    async confirmDeleteTask() {
        this.confirmationService.confirm({
            header: await firstValueFrom(this.translate.get(`Are you sure?`)),
            message: await firstValueFrom(this.translate.get(`Are you sure you want to delete this task?`)),
            icon: "pi pi-exclamation-triangle",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteTask();
            }
        });
    }

    deleteTask() {
        this.taskService.remove(this.task.id).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Removed`)),
                    detail: await firstValueFrom(this.translate.get(`Task removed successfully`)),
                    severity: "success"
                });
                this.onTaskRemoved.emit(this.task.id);
            }, 
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Error`)) + err,
                    detail: await firstValueFrom(this.translate.get(`Error removing task.`)) + err,
                    severity: "error"
                })
            }
        })
    }

    markTaskAsCompleted() {
        let task = this.task;
        task.completed = 1;
        this.taskService.edit(task.id, task).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Marked as complete`)),
                    detail: await firstValueFrom(this.translate.get(`Task marked as complete`)),
                    severity: 'contrast'
                });
                this.onTaskRemoved.emit(this.task.id);
            },
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Error`)),
                    detail: await firstValueFrom(this.translate.get(`Error marking task as complete.`)) + err,
                    severity: 'error'
                });
            }
        })
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
