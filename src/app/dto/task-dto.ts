import { UserBound } from "../services/service.abstract";

export enum RecurringType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    WEEKDAY = 'weekday',
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

export interface TaskDto {
    id: number;
    uuid: string;
    user_uuid: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    dueTime: Date | null;
    project: number | null;
    project_uuid: string | null;
    completed: number;
    order: number;
    parent: number | null;
    parent_uuid: string | null;
    recurring: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekday' | null;
    updated_at?: Date;
}

export type TaskAddDto = Omit<TaskDto, "id" > & UserBound;