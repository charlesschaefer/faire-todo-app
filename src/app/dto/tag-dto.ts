import { Updatable, UserBound } from "../services/service.abstract";

export interface TagDto extends Updatable {
    id: number;
    uuid: string;
    user_uuid: string;
    name: string;
    updated_at?: Date;
}

export type TagAddDto = Omit<TagDto, "id" > & UserBound;
