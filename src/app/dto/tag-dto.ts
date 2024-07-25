export interface TagDto {
    id: number;
    name: string;
}

export type TagAddDto = Omit<TagDto, "id">;
