import { Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { TaskTagAddDto, TaskTagDto } from '../dto/task-tag-dto';
import { DataUpdatedService } from '../db/data-updated.service';
import { DbService } from '../db/db.service';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class TaskTagService extends ServiceAbstract<TaskTagDto | TaskTagAddDto> {
    storeName = "task_tag";
    
    constructor(
        protected dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }
}
