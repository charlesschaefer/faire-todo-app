import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { TaskAddDto } from '../dto/task-dto';

@Injectable({
    providedIn: 'root'
})
export class TaskService<T extends TaskAddDto> extends ServiceAbstract<T> {
    storeName = "task";

    orderTasks(tasks: T[]) {
        tasks.sort((a, b) => {
            if (a.order > b.order) return 1;
            return -1;
        });
        return tasks;
    }
}
