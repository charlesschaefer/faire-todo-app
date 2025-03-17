import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Button, ButtonModule } from 'primeng/button';

import { FilePickerService } from '../services/file-picker.service';
import { TaskAttachmentDto } from '../dto/task-attachment-dto';
import { TaskAttachmentService } from '../services/task-attachment.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-task-attachment',
    imports: [
        ButtonModule,
        CommonModule,
    ],
    templateUrl: './task-attachment.component.html',
    styleUrl: './task-attachment.component.scss'
})
export class TaskAttachmentComponent {

    @Input() attachments: Partial<TaskAttachmentDto>[] = [];
    @Output() attachmentsChange = new EventEmitter<Partial<TaskAttachmentDto>[]>();

    constructor(
        private filePickerService: FilePickerService,
        private messageService: MessageService,
        private taskAttachmentService: TaskAttachmentService
    ) {}

    async addAttachment() {
        const base64Data = await this.filePickerService.pickFile();
        if (base64Data) {
            const attachment = {
                name: base64Data.name, // You can customize this based on your needs
                blob: base64Data.blob,
            };
            this.attachments.push(attachment);
            this.attachmentsChange.emit(this.attachments);
            console.log("Attachments: ", this.attachments)
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'No File Selected',
                detail: 'Please select a file to attach.',
            });
        }
    }

    removeAttachment(index: number) {
        const attachment = this.attachments.splice(index, 1);
        if (attachment[0].uuid) {
            this.taskAttachmentService.remove(attachment[0].uuid);
        }
        this.attachmentsChange.emit(this.attachments);
    }
}
