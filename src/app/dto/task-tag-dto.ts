import { Updatable } from "../services/service.abstract";

export interface TaskTagDto extends Updatable {
    id: number;
    uuid: string;
    user_uuid: string;
    task: number;
    task_uuid: string;
    tag: number;
    tag_uuid: string;
    updated_at?: Date;
}
