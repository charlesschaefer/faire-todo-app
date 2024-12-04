export interface TagDto {
    id: number;
    uuid: string;
    user_uuid: string;
    name: string;
}

export type TagAddDto = Omit<TagDto, "id">;
