import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { RecurringType, TaskAddDto, TaskDto } from '../dto/task-dto';
import { liveQuery } from 'dexie';
import { Observable, Subject, firstValueFrom, from, mergeMap, zip } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { TaskComponent } from '../task/task/task.component';

interface SubtaskCount {
    subtasks: number;
    completed: number;
}


@Injectable({
    providedIn: 'root'
})
export class TaskService<T extends TaskAddDto> extends ServiceAbstract<T> {
    storeName = "task";

    constructor() {
        super();
        this.table = this.dbService.task;
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
        let date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(liveQuery(() => {
            return this.table
                .where('dueDate')
                .equals(date)
                .and((task: TaskDto) => task.completed == 0)
                .and((task: TaskDto) => !task.parent || task.parent == null)
                .toArray();
        }));
    }

    countForToday() {
        let date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(liveQuery(() => {
            return this.table.where('dueDate').equals(date).and((task: TaskDto) => task.completed == 0).count();
        }));
    }

    getUpcoming() {
        let minDate = DateTime.fromJSDate(new Date).endOf('day').toJSDate();
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
        let countMap:Map<number, number> = new Map();
        for (let task of tasks) {
            let count = await firstValueFrom(this.countByField('parent', task.id));
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

    getAllTasks() {
        return from(liveQuery(() => {
            return this.table.where({
                completed: 0
            }).and((task) => !task.parent || task.parent == null).toArray();
        }))
    }

    markTaskComplete(task: TaskDto) {
        const success$ = new Subject();
        task.completed = 1;
        from(this.table.update(task.id, task)).subscribe({
            complete: () => {
                // checks if the task is recurring and creates a new task
                if (task.recurring) {
                    let newTask: TaskAddDto = task;
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
                }
            }
        });
        return success$;
    }
}

console.log("TaskComponent", TaskComponent);