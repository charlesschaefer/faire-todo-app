import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { RecurringType, TaskAddDto, TaskDto } from '../dto/task-dto';
import { Observable, Subject, firstValueFrom, from } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { MyDatabaseCollections } from '../app.rxdb';

interface SubtaskCount {
    subtasks: number;
    completed: number;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService<T extends TaskAddDto> extends ServiceAbstract<T> {
    storeName: keyof MyDatabaseCollections = "task";

    constructor(
        protected override dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

    listParentTasks() {
        return this.table.find({
            selector: {
                completed: {
                    $eq: 0
                },
                parent: {
                    $exists: false
                }
            } as any
        }).$;
    }

    orderTasks(tasks: T[]) {
        tasks.sort((a, b) => {
            if (a.order > b.order) return 1;
            return -1;
        });
        return tasks;
    }

    getFromProject(project: string): Observable<T[]> {
        return this.table.find({
            selector: {
                completed: 0,
                project: project,
                parent: {
                    $exists: false
                }
            } as any
        }).$;
    }

    getForToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        
        return this.table.find({
            selector: {
                dueDate: {
                    $lte: date.toISOString()
                },
                completed: 0,
                parent: {
                    $exists: false
                }
            } as any
        }).$;
    }

    countForToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        
        return this.table.count({
            selector: {
                dueDate: date.toISOString(),
                completed: 0
            } as any
        }).$;
    }

    getUpcoming() {
        const minDate = DateTime.fromJSDate(new Date()).endOf('day').toJSDate();
        
        return this.table.find({
            selector: {
                dueDate: {
                    $gt: minDate.toISOString()
                },
                completed: 0
            } as any
        }).$;
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
        return this.table.find({
            selector: {
                parent: task.id,
                completed: 0
            } as any
        }).$;
    }

    countTaskSubtasks(task: TaskDto): Observable<SubtaskCount> {
        const countSubtasks$ = new Subject<SubtaskCount>();
        
        Promise.all([
            firstValueFrom(this.table.count({
                selector: {
                    parent: task.id
                } as any
            }).$),
            firstValueFrom(this.table.count({
                selector: {
                    parent: task.id,
                    completed: 1
                } as any
            }).$)
        ]).then(([subtasks, completed]) => {
            countSubtasks$.next({
                subtasks, completed
            });
        });

        return countSubtasks$;        
    }

    getProjectTasks(projectId: string) {
        return this.table.find({
            selector: {
                project: projectId,
                completed: 0,
                parent: {
                    $exists: false
                }
            } as any
        }).$;
    }

    getAllTasks() {
        return this.table.find({
            selector: {
                completed: 0,
                parent: {
                    $exists: false
                }
            } as any
        }).$;
    }

    removeTask(task: TaskDto) {
        const removal$ = new Subject();
        
        this.remove(task.id).subscribe({
            complete: () => {
                this.getTaskSubtasks(task).subscribe({
                    next: (tasks) => {
                        tasks.forEach(task => {
                            this.removeTask(task as any).subscribe({
                                error: (err) => {
                                    removal$.error(err);
                                }
                            });
                        });
                        removal$.complete();
                    }
                });
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
        
        from(this.table.findOne(`id=${task.id}`).update({
            $set: { completed: 1 }
        })).subscribe({
            complete: () => {
                // checks if the task is recurring and creates a new task
                if (task.recurring) {
                    const aTask: Partial<TaskDto> = { ...task };
                    // removes id to enable creating a new task
                    delete aTask.id;
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
                    this.add(newTask as T).subscribe({
                        complete: () => success$.complete(),
                        error: (err) => success$.error(err)
                    });
                } else {
                    success$.complete();
                }
            }
        });
        
        return success$;
    }
}
