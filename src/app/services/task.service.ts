import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { RecurringType, TaskAddDto, TaskDto } from '../dto/task-dto';
import { liveQuery } from 'dexie';
import { Observable, Subject, firstValueFrom, from, zip } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { DbService } from './db.service';
import { AuthService } from './auth.service';

interface SubtaskCount {
    subtasks: number;
    completed: number;
}


@Injectable({
    providedIn: 'root'
})
export class TaskService<T extends TaskAddDto> extends ServiceAbstract<T> {
    storeName = "task";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

    listParentTasks() {
        return from(liveQuery(() => {
            return this.table.where({
                completed: 0,
                parent: null
            }).toArray();
        }))
    }

    orderTasks(tasks: T[]) {
        tasks.sort((a, b) => {
            if (a.order > b.order) return 1;
            return -1;
        });
        return tasks;
    }

    getFromProject(project: number): Observable<T[]> {
        return from(liveQuery(() => {
            return this.table.where({
                completed: 0,
                project: project,
            }).and((task) => !task.parent || task.parent  == null).toArray();
        }));
    }

    getForToday() {
        const date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(liveQuery(() => {
            return this.table
                .where('dueDate')
                .belowOrEqual(date)
                .and((task: TaskDto) => task.completed == 0)
                .and((task: TaskDto) => !task.parent || task.parent == null)
                .toArray();
        }));
    }

    countForToday() {
        const date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(liveQuery(() => {
            return this.table.where('dueDate').equals(date).and((task: TaskDto) => task.completed == 0).count();
        }));
    }

    getUpcoming() {
        const minDate = DateTime.fromJSDate(new Date).endOf('day').toJSDate();
        return from(liveQuery(() => {
            return this.table.where('dueDate').above(minDate).and((task: TaskDto) => task.completed == 0).toArray();
        }));
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
        const countMap = new Map<number, number>();
        for (const task of tasks) {
            const count = await firstValueFrom(this.countByField('parent', task.id));
            countMap.set(task.id, count);
        };
        return countMap;
    }

    getTaskSubtasks(task: TaskDto) {
        return from(liveQuery(() => {
            return this.table
                .where('parent')
                .equals(task.id)
                .and((task) => task.completed == 0)
                .toArray();
        }));
    }

    countTaskSubtasks(task: TaskDto): Observable<SubtaskCount> {
        const countSubtasks$ = new Subject<SubtaskCount>();
        
        zip(
            from(liveQuery(() => this.table.where({
                parent: task.id
            }).count())),
            from(liveQuery(() => this.table.where({
                parent: task.id,
                completed: 1
            }).count()))
        ).subscribe(([subtasks, completed]) => {
            countSubtasks$.next({
                subtasks, completed
            });
        });
        return countSubtasks$;        
    }

    getProjectTasks(projectId: number) {
        return from(liveQuery(() => {
            return this.table.where({
                project: projectId,
                completed: 0
            }).and((task) => !task.parent || task.parent == null).toArray();
        }))
    }

    getAllTasks() {
        return from(liveQuery(() => {
            return this.table.where({
                completed: 0
            }).and((task) => !task.parent || task.parent == null).toArray();
        }))
    }

    removeTask(task: TaskDto) {
        const removal$ = new Subject();
        this.remove(task.id).subscribe({
            complete: () => {
                this.getTaskSubtasks(task).subscribe({
                    next: (tasks) => {
                        tasks.forEach(task => {
                            this.removeTask(task).subscribe({
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
                throw new Error(`Couldn't remove task ${task.id}`);
            }
        });

        return removal$;
    }

    markTaskComplete(task: TaskDto) {
        const success$ = new Subject();
        task.completed = 1;
        from(this.table.update(task.id, task)).subscribe({
            complete: () => {
                // checks if the task is recurring and creates a new task
                if (task.recurring) {
                    const aTask:Partial<TaskDto> = task;
                    // removes id to enable creating a new task
                    aTask.id = undefined;
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
                    console.log(newTask);
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
}
