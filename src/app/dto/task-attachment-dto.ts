import { Updatable } from "./updatable";
import { UserBound } from "./user-bound";

export enum AttachmentType {
    PNG = 'PNG',
    JPG = 'JPG',
    PDF = 'PDF'
}

export enum AttachmentMimeType {
    PNG = 'image/png',
    JPG = 'image/jpeg',
    PDF = 'application/pdf'
}

export interface TaskAttachmentDto extends Updatable {
    uuid: string;
    user_uuid: string;
    task_uuid: string;
    updated_at?: Date;
    blob: string;
    name: string;
    file_type?: AttachmentType;
}

export type TaskAttachmentAddDto = Omit<TaskAttachmentDto, "id" > & UserBound;
