import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { TaskAddDto, TaskDto } from '../dto/task-dto';
import { liveQuery } from 'dexie';
import { Observable, Subject, firstValueFrom, from, mergeMap, zip } from 'rxjs';
import { DateTime } from 'luxon';
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
                .belowOrEqual(date)
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
        let removal$ = new Subject();
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
}

console.log("TaskComponent", TaskComponent);