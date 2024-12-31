import { Injectable } from '@angular/core';
import { ServiceAbstract } from '../services/service.abstract';
import { RecurringType, TaskAddDto, TaskDto, TaskTree } from '../dto/task-dto';
import { Observable, Subject, from, map, zip } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { DbService } from '../services/db.service';
import { AuthService } from '../auth/auth.service';
import { DataUpdatedService } from '../services/data-updated.service';
import { DatabaseChangeType, IDatabaseChange } from 'dexie-observable/api';

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

    async countTasksSubtasks(tasks: TaskDto[]) {
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

    countTaskSubtasks(task: TaskDto): Observable<SubtaskCount> {
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
                                }
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
        from(this.table.update(task.uuid, task)).subscribe({
            complete: () => {
                // checks if the task is recurring and creates a new task
                if (task.recurring) {
                    const aTask:Partial<TaskDto> = task;
                    // removes id to enable creating a new task
                    aTask.uuid = undefined;
                    aTask.completed = 0;
                    
                    const newTask = aTask as TaskAddDto;
                    let date = DateTime.fromJSDate(newTask.dueDate as Date);
                    switch (task.recurring) {
                        case RecurringType.DAILY:
                            date = date.plus(Duration.fromObject({day: 1}));
                            break;
                        case RecurringType.WEEKLY:
                            date = date.plus(Duration.fromObject({week: 1}));
                            break;
                        case RecurringType.MONTHLY: 
                            date = date.plus(Duration.fromObject({month: 1}));
                            break;
                        case RecurringType.YEARLY:
                            date = date.plus(Duration.fromObject({year: 1}));
                            break;
                        case RecurringType.WEEKDAY:
                            if (date.weekday < 5) {
                                date = date.plus(Duration.fromObject({day: 1}));
                            } else {
                                date = date.plus(Duration.fromObject({days: 3}));
                            }
                            break;
                    }
                   
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
                    success$.complete();
                }
            }
        });
        return success$;
    }

    getTaskTree(task: TaskDto) {
        const children: TaskTree[] = [];
        const taskTree = {...task, children} as TaskTree;
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
                subtasks.reduce((prev: TaskTree, current, idx, arr) => {
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
        const {children, ...task} = {...taskTree};
        const return$ = new Subject();

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

        tasks.forEach((task, key) => {
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

        const changes: {key: string, changes: Partial<TaskDto>}[] = [];
        const dataChanges: any = [];
        for (const task of tasks) {
            changes.push({
                key: task.uuid,
                changes: {
                    dueDate: today
                }
            });
            dataChanges.push({
                key: 'uuid',
                table: 'task',
                type: DatabaseChangeType.Update,
                changes: {
                    dueDate: today
                },
                oldObj: task,
                obj: {...task, dueDate: today}
            });
        }

        this.table.bulkUpdate(changes).then(() => {
            this.dataUpdatedService.next([dataChanges[0]]);
        });
    }
}
