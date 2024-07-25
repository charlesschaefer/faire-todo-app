import { DateTime } from "luxon";

export interface TaskDto {
    id: number;
    title: string;
    description: string | null;
    dueDate: DateTime | null;
    category: number | null;
    project: number | null;
}
