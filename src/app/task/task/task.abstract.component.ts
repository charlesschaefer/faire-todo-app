import {
    Component,
    computed,
    ElementRef,
    EventEmitter,
    inject,
    input,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from "@angular/core";
import { TranslocoService } from "@jsverse/transloco";
import { DateTime } from "luxon";
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { firstValueFrom, Observable, Subject } from "rxjs";

import { ProjectDto } from "../../dto/project-dto";
import { TaskDto, TaskTree } from "../../dto/task-dto";
import { UndoItem, UndoService } from "../../services/undo.service";
import { TaskService } from "../task.service";

import { isMobile } from "../../../utils/functions";

@Component({
    selector: "app-task",
    standalone: true,
    templateUrl: "./task.abstract.component.html",
})
export abstract class TaskAbstractComponent implements OnDestroy, OnInit {
    task = input.required<TaskDto>();
    _changedTask?: TaskDto;
    taskData = computed(() => {
        if (this._changedTask) {
            const task = this._changedTask;
            this._changedTask = undefined;
            return task;
        }
        return this.task();
    });

    projects = input.required<Map<string, ProjectDto>>();

    @Input() attachmentCount?: number;
    @Input() subtasksCount?: number;

    // eslint-disable-next-line @angular-eslint/no-output-on-prefix
    @Output() onTaskRemoved = new EventEmitter<string>();
    // eslint-disable-next-line @angular-eslint/no-output-on-prefix
    @Output() onEditTask = new EventEmitter<Event>();

    onSaveEditTask$ = new Subject();

    completed = false;
    dateTimeHandler = DateTime;

    today!: Date;
    due = false;
    future = false;

    dialogRef: DynamicDialogRef | undefined;

    taskMenuItems!: MenuItem[];

    subtasks!: TaskDto[];
    subtasksCompletedCount!: number;

    isMobile!: boolean;
    isTouch!: boolean;

    nativeElement: ElementRef = inject(ElementRef);
    clickEventObserver!: Observable<Event>;
    moveEventObserver!: Observable<MouseEvent>;

    constructor(
        protected dialogService: DialogService,
        protected messageService: MessageService,
        protected taskService: TaskService,
        protected confirmationService: ConfirmationService,
        protected translate: TranslocoService,
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
        this.onSaveEditTask$.subscribe(() => {
            this.onEditTask.emit();
            this.checkTaskIsDue();

            this.countSubtasks();
        });
        if (this.task().completed) {
            this.completed = true;
        }

        this.checkTaskIsDue();

        this.countSubtasks();

        this.isMobile = isMobile();
        this.isTouch = window.matchMedia("(pointer: coarse)").matches;
    }

    countSubtasks() {
        this.taskService
            .countSubtasksByCompletion(this.task())
            .subscribe((subtasksCount) => {
                this.subtasksCount = subtasksCount.subtasks;
                this.subtasksCompletedCount = subtasksCount.completed;
            });
    }

    checkTaskIsDue() {
        const task = this.task();
        if (!task.dueDate) {
            return;
        }

        if (this.taskService.isTaskDue(task)) {
            this.due = true;
            return;
        }

        const dueDate = DateTime.fromJSDate(task.dueDate);
        const today = DateTime.fromJSDate(this.today);
        if (dueDate.diff(today).as("days") >= 1) {
            this.future = true;
            return;
        }

        this.future = false;
        this.due = false;
    }

    async setTaskMenuItems() {
        this.taskMenuItems = [
            {
                label: this.translate.translate(`Options`),
                items: [
                    {
                        label: this.translate.translate(`Delete`),
                        icon: "pi pi-trash",
                        command: () => {
                            this.confirmDeleteTask();
                        },
                    } as MenuItem,
                    {
                        label: this.translate.translate(`Edit`),
                        icon: "pi pi-pencil",
                        command: () => {
                            this.showTaskEditDialog(this.task());
                        },
                    } as MenuItem,
                ],
            } as MenuItem,
        ];
    }

    abstract showTaskEditDialog(task: TaskDto): Promise<void>;

    async confirmDeleteTask() {
        this.confirmationService.confirm({
            header: this.translate.translate(`Are you sure?`),
            message: this.translate.translate(
                `Are you sure you want to delete this task? All subtasks will also be deleted!`,
            ),
            icon: "pi pi-exclamation-triangle",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteTask();
            },
        });
    }

    async deleteTask() {
        const taskAndChild = await firstValueFrom(
            this.taskService.getTaskTree(this.task()),
        );
        // gets all the task's subtasks to store as an undo queue item
        const undoData = Object.assign({}, taskAndChild);
        const undo: UndoItem = {
            type: "task.delete",
            data: undoData,
        };
        // removes task and it's subtasks
        this.taskService.removeTaskTree(this.task()).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: this.translate.translate(`Removed`),
                    detail: this.translate.translate(
                        `Task removed successfully`,
                    ),
                    severity: "success",
                    key: "task",
                });
                this.onTaskRemoved.emit(this.task().uuid);
                this.undoService.register(undo).subscribe((data) => {
                    this.undoDelete(data);
                });
            },
            error: async (err) => {
                this.messageService.add({
                    summary: this.translate.translate(`Error`) + err,
                    detail:
                        this.translate.translate(`Error removing task.`) + err,
                    severity: "error",
                    key: "task",
                });
            },
        });
    }

    undoDelete(undoData: UndoItem) {
        if (undoData.type == "task.delete") {
            const task = undoData.data as TaskTree;
            // reinserts the task and it's subtasks, recursivelly
            this.taskService.addTaskTree(task).subscribe({
                complete: async () => {
                    this.messageService.add({
                        summary: this.translate.translate(`Undone`),
                        detail: this.translate.translate(
                            `Your delete action was undone successfully.`,
                        ),
                        severity: "success",
                        key: "task",
                    });
                    this.onEditTask.emit();
                },
                error: async (err) => {
                    this.messageService.add({
                        summary: this.translate.translate(`Error`) + err,
                        detail:
                            this.translate.translate(
                                `Error trying to recover task.`,
                            ) + err,
                        severity: "error",
                        key: "task",
                    });
                    this.onEditTask.emit();
                },
            });
        }
    }

    markTaskAsCompleted() {
        const task = this.task();
        const undoData = Object.assign({}, task);
        const undo: UndoItem = {
            type: "task.markComplete",
            data: {
                oldTask: undoData,
                newTask: {},
            },
        };
        task.completed = this.completed ? 1 : 0;
        const successMsg = async () =>
            this.messageService.add({
                summary: this.translate.translate(`Marked as complete`),
                detail: this.translate.translate(`Task marked as complete`),
                severity: "success",
                key: "task",
            });

        const errorMsg = async (err: any) =>
            this.messageService.add({
                summary: this.translate.translate(`Error`),
                detail:
                    this.translate.translate(
                        `Error marking task as complete.`,
                    ) + err,
                severity: "error",
                key: "task",
            });
        if (task.completed) {
            this.taskService.markTaskComplete(task).subscribe({
                next: (newTask) => {
                    undo.data.newTask = newTask;
                },
                complete: async () => {
                    // await successMsg();
                    this.messageService.add({
                        summary: this.translate.translate(`Marked as complete`),
                        detail: this.translate.translate(
                            `Task marked as complete`,
                        ),
                        severity: "success",
                        key: "task",
                        life: 300000
                    });
                    console.log("emiting Task.onEditTask()");
                    this.onEditTask.emit();

                    this.undoService.register(undo).subscribe((data) => {
                        this.undoMarkAsComplete(data);
                    });
                },
                error: async (err) => {
                    await errorMsg(err);
                },
            });
        } else {
            this.taskService.edit(task.uuid, task).subscribe({
                complete: async () => {
                    await successMsg();
                    console.log("emiting Task.onEditTask()");
                    this.onEditTask.emit();
                    this.undoService.register(undo).subscribe((data) => {
                        this.undoMarkAsComplete(data);
                    });
                },
                error: async (err) => {
                    errorMsg(err);
                },
            });
        }
    }

    undoMarkAsComplete(undoData: UndoItem) {
        if (undoData.type == "task.markComplete") {
            const task = undoData.data.oldTask as TaskDto;
            console.log("Lets save the task again");
            this.taskService
                .undoMarkTaskComplete(
                    undoData.data.oldTask,
                    undoData.data.newTask.uuid ? undoData.data.newTask : null,
                )
                .subscribe({
                    complete: async () => {
                        console.log("undoMarkAsComplete().complete");
                        this.messageService.add({
                            summary: this.translate.translate(`Undone`),
                            detail: this.translate.translate(
                                `Task got back to it's initial state`,
                            ),
                            severity: "success",
                            key: "task",
                        });
                        console.log("Emiting onEditTask");
                        this.onEditTask.emit();
                    },
                    error: async (err: any) => {
                        console.log("undoMarkAsComplete().error");
                        this.messageService.add({
                            summary: this.translate.translate(`Error`),
                            detail:
                                this.translate.translate(
                                    `Error trying to undo marking task as complete.`,
                                ) + err,
                            severity: "error",
                            key: "task",
                        });
                        this.onEditTask.emit();
                    },
                });
        }
    }

    onSwipeLeft() {
        console.log("Swipe Left");
        this.confirmDeleteTask();
    }

    ngOnDestroy(): void {
        this.dialogRef?.close();
    }
}
