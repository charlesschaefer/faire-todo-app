import { DateTime } from "luxon";

export interface TaskDto {
    id: number;
    title: string;
    description: string | null;
    dueDate: Date | null;
    dueTime: Date | null;
    project: number | null;
    completed: number; // number because indexeddb doesn't accept boolean as keys
    order: number;
    parent: number | null;
}

export type TaskAddDto = Omit<TaskDto, "id">;