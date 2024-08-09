import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { TranslateService } from '@ngx-translate/core';
import { DateTime } from 'luxon';
import { firstValueFrom, Subject } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TreeModule } from 'primeng/tree';

import { TaskDto } from '../../dto/task-dto';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskService } from '../../services/task.service';
import { ProjectDto } from '../../dto/project-dto';
import { UndoItem, UndoService } from '../../services/undo.service';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';


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
        ToastModule,
        ContextMenuModule,
        TreeModule,
        DateShortenerPipe
    ],
    providers: [
        MessageService,
        DialogService,
        ConfirmationService,
    ],
    templateUrl: './task.component.html',
    styleUrl: './task.component.scss'
})
export class TaskComponent implements OnDestroy, OnInit, OnChanges {
    @Input() task!: TaskDto;
    @Input() projects!: Map<number, ProjectDto>;
    @Input() subtasksCount!: number | undefined;

    @Output() onTaskRemoved = new EventEmitter<number>();
    @Output() onEditTask = new EventEmitter<Event>();

    onSaveEditTask$ = new Subject();

    completed: boolean = false;
    dateTimeHandler = DateTime;

    today!: Date;
    due: boolean = false;

    dialogRef: DynamicDialogRef | undefined;

    taskMenuItems!: MenuItem[];

    subtasks!: TreeNode[];

    isMobile!: boolean;
    
    constructor(
        private dialogService: DialogService,
        private messageService: MessageService,
        private taskService: TaskService<TaskDto>,
        private confirmationService: ConfirmationService,
        private translate: TranslateService,
        private undoService: UndoService,
    ) {
        this.setTaskMenuItems();

        this.today = new Date();
        this.today.setHours(0);
        this.today.setMinutes(0);
        this.today.setSeconds(0);
        this.today.setMilliseconds(0);
    }

    ngOnInit() {
        this.onSaveEditTask$.subscribe(value => {
            this.onEditTask.emit();
        });
        if (this.task.completed) {
            this.completed = true;
        }

        this.checkTaskIsDue();

        this.isMobile = Boolean(navigator.userAgent.toLowerCase().match(/(android|iphone|android|iemobile|ipad)/i));
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['subtasksCount']) {
            this.subtasks = [{
                key: '0',
                label: `${this.subtasksCount} tasks`
            }];
        }
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
