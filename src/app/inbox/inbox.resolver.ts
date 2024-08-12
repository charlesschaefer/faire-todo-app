import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, MaybeAsync, Resolve, RouterStateSnapshot } from '@angular/router';


import { TaskDto } from '../dto/task-dto';
import { TaskService } from '../services/task.service';
import { from, map, mergeMap } from 'rxjs';

interface InboxResolvedData {
    tasks: TaskDto[];
    subtasksCount: Map<number, number>;
}

@Injectable({ providedIn: 'root'})
export class InboxResolver implements Resolve<InboxResolvedData> {
    constructor(
        private taskService: TaskService<TaskDto>
    ) {}
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<InboxResolvedData> {
        return this.taskService.getFromProject(0).pipe(
            mergeMap((tasks) => {
                tasks = this.taskService.orderTasks(tasks);
                return from(this.taskService.countTasksSubtasks(tasks)).pipe(
                    map(subtasksCount => {
                        return { tasks: tasks, subtasksCount: subtasksCount} as InboxResolvedData
                    })
                )
            })
        );
    }
}

