import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, MaybeAsync, Resolve, RouterStateSnapshot } from '@angular/router';


import { TaskDto } from '../dto/task-dto';
import { from, map, mergeMap } from 'rxjs';
import { TaskService } from '../task/task.service';

interface InboxResolvedData {
    tasks: TaskDto[];
    subtasksCount: Map<string, number>;
}

@Injectable({ providedIn: 'root'})
export class InboxResolver implements Resolve<InboxResolvedData> {
    constructor(
        private taskService: TaskService
    ) {}
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<InboxResolvedData> {
        return this.taskService.getFromProject('').pipe(
            mergeMap((tasks) => {
                tasks = this.taskService.orderTasks(tasks as TaskDto[]);
                return from(this.taskService.countTasksSubtasks(tasks as TaskDto[])).pipe(
                    map(subtasksCount => {
                        return { 
                            tasks: tasks, 
                            subtasksCount: subtasksCount
                        } as InboxResolvedData
                    })
                )
            })
        );
    }
}

