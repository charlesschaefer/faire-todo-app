import { Settings } from "luxon";

export interface SettingsDto {
    id: number;
    notifications: number;
    todayNotifications: number;
    notificationTime: Date | null;
}

export type SettingsAddDto = Omit<SettingsDto, 'id'>;
