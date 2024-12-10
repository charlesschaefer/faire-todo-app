import { UserBound } from "../services/service.abstract";

export interface ProjectDto {
    id: number;
    uuid: string;
    user_uuid: string;
    name: string;
    updated_at?: Date;
}

export type ProjectAddDto = Omit<ProjectDto, "id" > & UserBound;
