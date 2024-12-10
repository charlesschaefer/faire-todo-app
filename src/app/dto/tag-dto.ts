import { UserBound } from "../services/service.abstract";

export interface TagDto {
    id: number;
    uuid: string;
    user_uuid: string;
    name: string;
    updated_at?: Date;
}

export type TagAddDto = Omit<TagDto, "id" > & UserBound;
