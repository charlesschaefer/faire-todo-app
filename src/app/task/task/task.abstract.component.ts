import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateTime } from 'luxon';
import { firstValueFrom, Subject } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../../services/task.service';
import { ProjectDto } from '../../dto/project-dto';
import { UndoItem, UndoService } from '../../services/undo.service';


@Component({
    selector: 'app-task',
    standalone: true,
    templateUrl: './task.abstract.component.html'
})
export abstract class TaskAbstractComponent implements OnDestroy, OnInit {
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

        this.countSubtasks();

        this.isMobile = Boolean(navigator.userAgent.toLowerCase().match(/(android|iphone|android|iemobile|ipad)/i));
    }

    countSubtasks() {
        this.taskService.countTaskSubtasks(this.task).subscribe(subtasksCount => {
            this.subtasksCount = subtasksCount.subtasks;
            this.subtasksCompletedCount = subtasksCount.completed;
        });
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

    abstract showTaskEditDialog(task: TaskDto): Promise<void>;

    async confirmDeleteTask() {
        this.confirmationService.confirm({
            header: await firstValueFrom(this.translate.get(`Are you sure?`)),
            message: await firstValueFrom(this.translate.get(`Are you sure you want to delete this task? All subtasks will also be deleted!`)),
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
        this.taskService.removeTask(this.task).subscribe({
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
                        severity: "success",
                        key: "task"
                    });
                    this.onEditTask.emit();
                }, 
                error: async (err) => {
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Error`)) + err,
                        detail: await firstValueFrom(this.translate.get(`Error trying to recover task.`)) + err,
                        severity: "error",
                        key: "task"
                    });
                    this.onEditTask.emit();
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
        const successMsg = async () => this.messageService.add({
            summary: await firstValueFrom(this.translate.get(`Marked as complete`)),
            detail: await firstValueFrom(this.translate.get(`Task marked as complete`)),
            severity: 'success'
        });
        const errorMsg = async (err: any) => this.messageService.add({
            summary: await firstValueFrom(this.translate.get(`Error`)),
            detail: await firstValueFrom(this.translate.get(`Error marking task as complete.`)) + err,
            severity: 'error'
        });
        if (task.completed) {
            this.taskService.markTaskComplete(task).subscribe({
                complete: async () => {
                    successMsg();
                    console.log("emiting Task.onEditTask()")
                    this.onEditTask.emit();
                    this.undoService.register(undo).subscribe((data) => {
                        this.undoMarkAsComplete(data);
                    });
                },
                error: async (err) => {
                    errorMsg(err);
                }
            })
        } else {
            this.taskService.edit(task.id, task).subscribe({
                complete: async () => {
                    successMsg();
                    console.log("emiting Task.onEditTask()")
                    this.onEditTask.emit();
                    this.undoService.register(undo).subscribe((data) => {
                        this.undoMarkAsComplete(data);
                    });
                },
                error: async (err) => {
                    errorMsg(err);
                }
            })
        }
    }

    undoMarkAsComplete(undoData: UndoItem) {
        if (undoData.type == 'task.markComplete') {
            const task = undoData.data as TaskDto;
            console.log("Lets save the task again");
            this.taskService.edit(task.id, task).subscribe({
                complete: async () => {
                    console.log("undoMarkAsComplete().complete")
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Undone`)),
                        detail: await firstValueFrom(this.translate.get(`Task got back to it's initial state`)),
                        severity: 'success',
                        key: "task"
                    });
                    console.log("Emiting onEditTask")
                    this.onEditTask.emit();
                },
                error: async (err) => {
                    console.log("undoMarkAsComplete().error")
                    this.messageService.add({
                        summary: await firstValueFrom(this.translate.get(`Error`)),
                        detail: await firstValueFrom(this.translate.get(`Error trying to undo marking task as complete.`)) + err,
                        severity: 'error',
                        key: "task"
                    });
                    this.onEditTask.emit();
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
