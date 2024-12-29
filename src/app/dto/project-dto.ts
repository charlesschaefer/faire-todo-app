import { Updatable } from "./updatable";
import { UserBound } from "./user-bound";

export interface ProjectDto extends Updatable {
    id: number;
    uuid: string;
    user_uuid: string;
    name: string;
    updated_at?: Date;
}

export type ProjectAddDto = Omit<ProjectDto, "id" > & UserBound;
