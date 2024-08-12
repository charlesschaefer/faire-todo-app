import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TaskDto } from '../../dto/task-dto';
import { TaskComponent } from '../task/task.component';
import { TaskService } from '../../services/task.service';
import { UndoItem, UndoService } from '../../services/undo.service';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';
import { ProjectDto } from '../../dto/project-dto';
import { Subject, firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskEditComponent } from '../task-edit/task-edit.component';

console.log(TaskComponent);
@Component({
    selector: 'app-subtask',
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
        ToastModule,
        ContextMenuModule,
        DateShortenerPipe,
        TranslateModule,
    ],
    providers: [
        MessageService,
        DialogService,
        ConfirmationService,
        TranslateService
    ],
    templateUrl: '../task/task.component.html',
    styleUrl: '../task/task.component.scss'
})
export class SubtaskComponent {
    @Input() task!: TaskDto;

    @Input() projects!: Map<number, ProjectDto>;

    @Output() onTaskRemoved = new EventEmitter<number>();
    @Output() onEditTask = new EventEmitter<Event>();

    onSaveEditTask$ = new Subject();

    completed: boolean = false;
    dateTimeHandler = DateTime;

    today!: Date;
    due: boolean = false;

    dialogRef: DynamicDialogRef | undefined;

    taskMenuItems!: MenuItem[];

    subtasks!: TaskDto[];
    subtasksCount!: number;
    subtasksCompletedCount!: number;

    isMobile!: boolean;

    constructor(
        protected dialogService: DialogService,
        protected messageService: MessageService,
        protected taskService: TaskService<TaskDto>,
        protected confirmationService: ConfirmationService,
        protected translate: TranslateService,
        protected undoService: UndoService,
    ) {
        /* super(
            dialogService,
            messageService,
            taskService,
            confirmationService,
            translate,
            undoService,
        ); */
    }

    checkTaskIsDue() {
        if (!this.task.dueDate) {
            this.due = false;
            return;
        }
        
        let dueDate = DateTime.fromJSDate(this.task.dueDate);
        const today = DateTime.fromJSDate(this.today);

        if (dueDate.diff(today).as('seconds') < 0 ) {
            this.due = true;
            return;
        }
        if (this.task.dueTime) {
            dueDate = dueDate.set({
                hour: this.task.dueTime.getHours(),
                minute: this.task.dueTime.getMinutes()
            });
            if (dueDate.diffNow().as('seconds') < 0) {
                this.due = true;
                return;
            }
        }
        this.due = false;
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
                    } as MenuItem,
                    {
                        label: await firstValueFrom(this.translate.get(`Edit`)),
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.showTaskEditDialog(this.task);
                        },
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
                this.checkTaskIsDue();
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
        let undoData = Object.assign({}, this.task);
        const undo: UndoItem = {
            type: 'task.delete',
            data: undoData
        };
        this.taskService.remove(this.task.id).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Removed`)),
                    detail: await firstValueFrom(this.translate.get(`Task removed successfully`)),
                    severity: "success"
                });
                this.onTaskRemoved.emit(this.task.id);
                this.undoService.register(undo).subscribe(data => {
                    this.undoDelete(data);
                });
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

    undoDelete(undoData: UndoItem) {
        if (undoData.type == 'task.delete') {
            let task = undoData.data as TaskDto;
            this.taskService.add(task).subscribe({
                complete: async () => {
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Undone`)),
                        detail: await firstValueFrom(this.translate.get(`Your delete action was undone successfully.`)),
                        severity: "success"
                    });
                }, 
                error: async (err) => {
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Error`)) + err,
                        detail: await firstValueFrom(this.translate.get(`Error trying to recover task.`)) + err,
                        severity: "error"
                    });
                }
            });
        }
    }

    markTaskAsCompleted() {
        let task = this.task;
        let undoData = Object.assign({}, task);
        const undo: UndoItem = {
            type: 'task.markComplete',
            data: undoData
        };
        task.completed = this.completed ? 1 : 0;
        this.taskService.edit(task.id, task).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Marked as complete`)),
                    detail: await firstValueFrom(this.translate.get(`Task marked as complete`)),
                    severity: 'success'
                });
                this.onTaskRemoved.emit(this.task.id);
                this.undoService.register(undo).subscribe((data) => {
                    this.undoMarkAsComplete(data);
                });
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

    undoMarkAsComplete(undoData: UndoItem) {
        if (undoData.type == 'task.markComplete') {
            const task = undoData.data as TaskDto;
            this.taskService.edit(task.id, task).subscribe({
                complete: async () => {
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Undone`)),
                        detail: await firstValueFrom(this.translate.get(`Task got back to it's initial state`)),
                        severity: 'success'
                    });
                },
                error: async (err) => {
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Error`)),
                        detail: await firstValueFrom(this.translate.get(`Error trying to undo marking task as complete.`)) + err,
                        severity: 'error'
                    });
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
console.log("SubtaskComponent", SubtaskComponent);