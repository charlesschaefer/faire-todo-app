import { DateTime } from "luxon";

export enum RecurringType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    WEEKDAY = 'weekday',
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

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
    recurring: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekday' | null
}

export type TaskAddDto = Omit<TaskDto, "id">;