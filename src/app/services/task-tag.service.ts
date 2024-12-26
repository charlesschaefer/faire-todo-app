import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from '../auth/auth.service';
import { TaskDto } from '../dto/task-dto';
import { TaskTagAddDto, TaskTagDto } from '../dto/task-tag-dto';
import { DataUpdatedService } from './data-updated.service';

@Injectable({
    providedIn: 'root'
})
export class TaskTagService extends ServiceAbstract<TaskTagDto | TaskTagAddDto> {
    storeName = "task_tag";
    
    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }
}
