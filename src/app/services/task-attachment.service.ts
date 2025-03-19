import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AppDb } from '../app.db';
import { TaskAttachmentDto, TaskAttachmentAddDto } from '../dto/task-attachment-dto';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from '../auth/auth.service';
import { DataUpdatedService } from './data-updated.service';
import { TaskDto } from '../dto/task-dto';

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
    
    async saveTaskAttachments(task: TaskDto, attachments: Partial<TaskAttachmentDto>[]) {
        attachments.forEach(async (attachment) => {
            attachment.updated_at = new Date();
            if (attachment?.uuid) {
                const ok = await this.edit(attachment.uuid, attachment as TaskAttachmentDto);
            } else {
                attachment.task_uuid = task.uuid;
                attachment.user_uuid = task.user_uuid;
                const ok = await this.upsert(attachment as TaskAttachmentAddDto);
            }
        });
    }
}
