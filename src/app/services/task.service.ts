import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { TaskAddDto, TaskDto } from '../dto/task-dto';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { DateTime } from 'luxon';

@Injectable({
    providedIn: 'root'
})
export class TaskService<T extends TaskAddDto> extends ServiceAbstract<T> {
    storeName = "task";

    constructor() {
        super();
        this.table = this.dbService.task;
    }

    orderTasks(tasks: T[]) {
        tasks.sort((a, b) => {
            if (a.order > b.order) return 1;
            return -1;
        });
        return tasks;
    }

    getFromProject(project: number) {
        return from(liveQuery(() => {
            return this.table.where({
                completed: 0,
                project: project,
            }).toArray();
        }));
    }

    getForToday() {
        let date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return from(liveQuery(() => {
            return this.table.where('dueDate').equals(date).and((task: TaskDto) => task.completed == 0).toArray();
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
}
