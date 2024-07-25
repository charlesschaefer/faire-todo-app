export interface ProjectDto {
    id: number;
    name: string;
}

export type ProjectAddDto = Omit<ProjectDto, "id">;
