import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Button, ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { FilePickerService } from '../../services/file-picker.service';
import { AttachmentMimeType, AttachmentType, TaskAttachmentDto } from '../../dto/task-attachment-dto';
import { TaskAttachmentService } from '../../services/task-attachment.service';
import { CommonModule } from '@angular/common';
import { encodeFileToBase64 } from '../../utils/file-utils';
import { invoke } from '@tauri-apps/api/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-task-attachment',
    imports: [
        ButtonModule,
        CommonModule,
        DialogModule,
        TranslocoModule,
    ],
    templateUrl: './task-attachment.component.html',
    styleUrl: './task-attachment.component.scss'
})
export class TaskAttachmentComponent {

    @Input() attachments: Partial<TaskAttachmentDto>[] = [];
    @Output() attachmentsChange = new EventEmitter<Partial<TaskAttachmentDto>[]>();

    popover_img!: string;
    popover_pdf!: string;
    popoverImgVisible = signal(false);

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
                file_type: base64Data.file_type
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

    async openImage(blob: string | undefined, type: AttachmentType | undefined) {
        
        const buffer = await invoke<Uint8Array>('decode_base64_to_binary', {blob});
        const blobs = new Blob([new Uint8Array(buffer)], {
            type: AttachmentMimeType[type as AttachmentType]
        });
        console.log("Blobs: ", blobs);

        const url = URL.createObjectURL(blobs);
        if (type == AttachmentType.PDF) {
            this.popover_pdf = url;
        } else {
            this.popover_img = url;
        }
        this.popoverImgVisible.set(true);
    }
}
