import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AppDb } from '../app.db';
import { TaskAttachmentDto, TaskAttachmentAddDto } from '../dto/task-attachment-dto';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from '../auth/auth.service';
import { DataUpdatedService } from './data-updated.service';

@Injectable({
    providedIn: 'root',
})
export class TaskAttachmentService extends ServiceAbstract<TaskAttachmentDto | TaskAttachmentAddDto> {
    storeName = "task_attachment"; // Corrected store name to match the table

    constructor(
        protected override dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }
    
}
