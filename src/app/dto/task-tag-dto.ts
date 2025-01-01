import { Updatable } from "./updatable";
import { UserBound } from "./user-bound";

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
export type TaskTagAddDto = Omit<TaskTagDto, "id" > & UserBound;
