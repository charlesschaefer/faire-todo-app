import { Updatable } from "./updatable";
import { UserBound } from "./user-bound";

export enum AttachmentType {
    PNG,
    JPG,
    PDF
}

export interface TaskAttachmentDto extends Updatable {
    uuid: string;
    user_uuid: string;
    task_uuid: string;
    updated_at?: Date;
    blob: string;
}

export type TaskAttachmentAddDto = Omit<TaskAttachmentDto, "id" > & UserBound;
