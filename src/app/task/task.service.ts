import { Injectable } from '@angular/core';
import { DatabaseChangeType, IDatabaseChange } from 'dexie-observable/api';
import { DateTime, Duration } from 'luxon';
import { Observable, Subject, from, map, zip } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { RecurringType, TaskAddDto, TaskDto, TaskTree } from '../dto/task-dto';
import { DataUpdatedService } from '../services/data-updated.service';
import { DbService } from '../services/db.service';
import { ServiceAbstract } from '../services/service.abstract';
import { TaskAttachmentDto } from '../dto/task-attachment-dto';

interface SubtaskCount {
    subtasks: number;
    completed: number;
}

type Tasks = TaskAddDto | TaskDto;

@Injectable({
    providedIn: 'root'
})
export class TaskService extends ServiceAbstract<Tasks> {
    storeName = "task";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }

    private fillOriginalDueDate(data: Tasks) {
        if (!data.dueDate) {
            data.originalDueDate = null;
        } else if (!data.originalDueDate) {
            data.originalDueDate = data.dueDate;
        }
        return data;
    }

    override add(data: Tasks): Observable<any> {
        data = this.fillOriginalDueDate(data);
        return super.add(data);
    }
    override upsert(data: Tasks) {
        data = this.fillOriginalDueDate(data);
        return super.upsert(data);
    }

    override bulkAdd(data: Tasks[]) {
        data = data.map((task) => this.fillOriginalDueDate(task));
        return super.bulkAdd(data);
    }

    override edit(uuid: string, data: Tasks) {
        data = this.fillOriginalDueDate(data);
        return super.edit(uuid, data);
    }
    listParentTasks() {
        return from(
            this.table.where({
                completed: 0,
            }).and((task) => task.parent_uuid === null || task.parent_uuid === '' || !task.parent_uuid).toArray()
        ) as Observable<TaskDto[]>
    }

    orderTasks(tasks: TaskDto[]) {
        tasks.sort((a, b) => {
            if (a.order > b.order) return 1;
            return -1;
        });
        return tasks;
    }

    getFromProject(project_uuid: string): Observable<TaskDto[]> {
        console.log("Criteria: ", {
            completed: 0,
            project_uuid: project_uuid,
        });
        return from(
            this.table.where({
                completed: 0,
                // project_uuid: project_uuid,
            }).and((task) => task.project_uuid === project_uuid || (!project_uuid && task.project_uuid === null || task.project_uuid === '' || !task.project_uuid)).toArray()
        ) as Observable<TaskDto[]>;
    }

    getForToday() {
        const date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(
            this.table
                .where('dueDate')
                .belowOrEqual(date)
                .and((task: Tasks) => task.completed == 0)
                .and((task: Tasks) => task.parent_uuid === null || task.parent_uuid === '' || !task.parent_uuid)
                .toArray()
        ) as Observable<TaskDto[]>;
    }

    countForToday() {
        const date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(this.table.where('dueDate').equals(date).and((task: Tasks) => task.completed == 0).count());
    }

    getUpcoming() {
        const minDate = DateTime.fromJSDate(new Date).endOf('day').toJSDate();
        return from(
            this.table.where('dueDate').above(minDate).and((task: Tasks) => task.completed == 0).toArray()
        ) as Observable<TaskDto[]>;
    }

    orderTasksByCompletion(tasks: TaskDto[]): TaskDto[] {
        tasks.sort((a, b) => {
            if (a.completed == 0) return -1;
            if (b.completed == 0) return 1;
            return 0;
        });
        return tasks;
    }

    async countAllTasksSubtasks(tasks: TaskDto[]) {
        const countMap = new Map<string, number>();
        for (const task of tasks) {
            const count = await this.countByField('parent_uuid', task.uuid);
            countMap.set(task.uuid, count);
        };
        return countMap;
    }

    getTaskSubtasks(task: TaskDto) {
        return from(this.table
            .where('parent_uuid')
            .equals(task.uuid)
            .and((task) => task.completed == 0)
            .toArray()
        ) as Observable<TaskDto[]>;
    }

    countSubtasksByCompletion(task: TaskDto): Observable<SubtaskCount> {
        const countSubtasks$ = new Subject<SubtaskCount>();

        zip(
            from(this.table.where({
                parent_uuid: task.uuid
            }).count()),
            from(this.table.where({
                parent_uuid: task.uuid,
                completed: 1
            }).count())
        ).subscribe(([subtasks, completed]) => {
            countSubtasks$.next({
                subtasks, completed
            });
        });
        return countSubtasks$;
    }

    getProjectTasks(projectUuid: string) {
        return from(this.table.where({
            project_uuid: projectUuid || '',
            completed: 0
        }).and((task) => task.parent_uuid === null || task.parent_uuid === '' || !task.parent_uuid).toArray()
        ) as Observable<TaskDto[]>;
    }

    getAllTasks() {
        return from(this.table.where({
            completed: 0
        }).and((task) => task.parent_uuid === null || task.parent_uuid === '' || !task.parent_uuid).toArray()
        ) as Observable<TaskDto[]>;
    }

    removeTaskTree(task: TaskDto) {
        const removal$ = new Subject();
        this.remove(task.uuid).subscribe({
            complete: () => {
                this.getTaskSubtasks(task).subscribe({
                    next: (tasks) => {
                        tasks.forEach(task => {
                            this.removeTaskTree(task as TaskDto).subscribe({
                                error: (err) => {
                                    removal$.error(err);
                                },
                                next: () => this.dataUpdatedService.next([{
                                    type: DatabaseChangeType.Update,
                                    key: 'uuid',
                                    table: 'task',
                                    mods: task,
                                    obj: task,
                                    oldObj: task
                                }])
                            });
                        });
                        removal$.complete();
                    }
                })
            },
            error: () => {
                throw new Error(`Couldn't remove task ${task.uuid}`);
            }
        });

        return removal$;
    }

    markTaskComplete(task: TaskDto) {
        const success$ = new Subject();
        task.completed = 1;
        from(this.edit(task.uuid, task)).subscribe({
            complete: () => {
                // checks if the task is recurring and creates a new task
                if (task.recurring) {
                    const aTask: Partial<TaskDto> = task;
                    // removes id to enable creating a new task
                    aTask.uuid = undefined;
                    aTask.completed = 0;

                    const newTask = aTask as TaskAddDto;
                    //let date = DateTime.fromJSDate(newTask.dueDate as Date);
                    let date = DateTime.fromJSDate((newTask.originalDueDate ?? newTask.dueDate) as Date); // Use originalDueDate if available
                    date = this.newDateForRecurringTask(task, date, DateTime.fromJSDate(newTask.dueDate as Date));

                    newTask.dueDate = date.toJSDate();
                    from(this.table.add(newTask)).subscribe({
                        complete: () => {
                            success$.complete();
                        },
                        error: (err) => {
                            success$.error(err);
                        }
                    })
                } else {
                    task.originalDueDate = null; // Clear originalDueDate if not recurring
                    success$.complete();
                }

                this.dataUpdatedService.next([{
                    type: DatabaseChangeType.Update,
                    key: 'uuid',
                    table: 'task',
                    mods: task,
                    obj: task,
                    oldObj: task
                }]);
            }
        });
        return success$;
    }

    private newDateForRecurringTask(task: TaskDto, date: DateTime, lastDueDate: DateTime) {
        const startOfToday = DateTime.now().startOf('day');
        const startOfDueDate = lastDueDate.startOf('day');
        // Checks if the date is before today
        do {
            switch (task.recurring) {
                case RecurringType.DAILY:
                    date = date.plus(Duration.fromObject({ day: 1 }));
                    break;
                case RecurringType.WEEKLY:
                    date = date.plus(Duration.fromObject({ week: 1 }));
                    break;
                case RecurringType.MONTHLY:
                    date = date.plus(Duration.fromObject({ month: 1 }));
                    break;
                case RecurringType.YEARLY:
                    date = date.plus(Duration.fromObject({ year: 1 }));
                    break;
                case RecurringType.WEEKDAY:
                    if (date.weekday < 5) {
                        date = date.plus(Duration.fromObject({ day: 1 }));
                    } else {
                        date = date.plus(Duration.fromObject({ days: 3 }));
                    }
                    break;
            }
        } while (date.startOf('day') < startOfToday || date.startOf('day') <= startOfDueDate);
        return date;
    }

    getTaskTree(task: TaskDto) {
        const children: TaskTree[] = [];
        const taskTree = { ...task, children } as TaskTree;
        const resultDispatcher = new Subject<TaskTree>();
        from(this.table.where({
            parent_uuid: task.uuid
        }).toArray()).pipe(
            map(subtasks => {
                const afterPush = new Subject<TaskTree>();
                if (!subtasks.length) {
                    setTimeout(() => {
                        afterPush.next(taskTree);
                        afterPush.complete();
                    }, 0);
                    return afterPush;
                }
                const total = subtasks.length;
                subtasks.reduce((prev: TaskTree, current, idx) => {
                    this.getTaskTree(current as TaskDto).subscribe(subtaskTree => {
                        prev.children.push(subtaskTree);
                        if (idx == total - 1) {
                            afterPush.next(prev);
                            afterPush.complete();
                        }
                    });
                    return prev;
                }, taskTree);
                return afterPush;
            })
        ).subscribe(afterPush => afterPush.subscribe(taskAndTree => {
            resultDispatcher.next(taskAndTree);
            resultDispatcher.complete();
        }));
        return resultDispatcher.asObservable();
    }

    addTaskTree(taskTree: TaskTree, internal = false) {
        const { children, ...task } = { ...taskTree };
        const return$ = new Subject();

        task['updated_at'] = new Date();

        this.table.add(task as TaskDto).then((result) => {
            if (!children || !children.length) {
                if (!internal) {
                    this.dataUpdatedService.next([{
                        key: 'uuid',
                        table: 'task',
                        type: DatabaseChangeType.Create,
                        obj: task
                    }] as IDatabaseChange[]);
                }
                return return$.next(result);
            }
            children.map((child, index) => this.addTaskTree(child, true).subscribe(result => {
                if (index == children.length - 1) {
                    if (!internal) {
                        this.dataUpdatedService.next([{
                            key: 'uuid',
                            table: 'task',
                            type: DatabaseChangeType.Create,
                            obj: task
                        }] as IDatabaseChange[]);
                    }
                    return$.next(result);
                }
            }))
        }).catch(error => return$.error(error));
        return return$.asObservable();
    }

    separateDueTasks(tasks: TaskDto[]) {
        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        const dueTasks: TaskDto[] = [];
        const otherTasks: TaskDto[] = [];

        tasks.forEach(task => {
            if (this.isTaskDue(task)) {
                dueTasks.push(task);
            } else {
                otherTasks.push(task);
            }
        });
        tasks = otherTasks;

        return {
            dueTasks,
            otherTasks
        };
    }

    isTaskDue(task: TaskDto) {
        const now = new Date();
        // we can do that because dueDate is always at midnight
        if (!task.dueDate || task.dueDate > now) {
            return false;
        }

        const taskTime = new Date(task.dueDate);
        if (task.dueTime) {
            taskTime.setHours(task.dueTime.getHours());
            taskTime.setMinutes(task.dueTime.getMinutes());
            taskTime.setSeconds(task.dueTime.getSeconds());
            if (taskTime <= now) {
                return true;
            }
        } else if (taskTime < DateTime.now().startOf('day').toJSDate()) {
            return true;
        }
        return false;
    }

    rescheduleTasksForToday(tasks: TaskDto[]) {
        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        const now = new Date();

        const changes: { key: string, changes: Partial<TaskDto> }[] = [];
        const dataChanges: any = [];
        for (const task of tasks) {
            changes.push({
                key: task.uuid,
                changes: {
                    dueDate: today,
                    updated_at: now
                }
            });
            dataChanges.push({
                key: 'uuid',
                table: 'task',
                type: DatabaseChangeType.Update,
                changes: {
                    dueDate: today,
                    updated_at: now
                },
                oldObj: task,
                obj: { ...task, dueDate: today }
            });
        }

        this.table.bulkUpdate(changes).then(() => {
            this.dataUpdatedService.next([dataChanges[0]]);
        });
    }

    countAttachmentsForTasks(tasks: TaskDto[]): Observable<Map<string, number>> {
        const attachmentCounts$ = new Observable<Map<string, number>>((observer) => {
            const attachmentCounts = new Map<string, number>();

            const taskUuids = tasks.map((task) => task.uuid);

            this.dbService.getTable("task_attachment")
                .where('task_uuid')
                .anyOf(taskUuids)
                .toArray()
                .then((attachments: TaskAttachmentDto[]) => {
                    attachments.forEach((attachment) => {
                        const count = attachmentCounts.get(attachment.task_uuid) || 0;
                        attachmentCounts.set(attachment.task_uuid, count + 1);
                    });

                    observer.next(attachmentCounts);
                    observer.complete();
                })
                .catch((error) => observer.error(error));
        });

        return attachmentCounts$;
    }
}

