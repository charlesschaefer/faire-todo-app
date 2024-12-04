import { Settings } from "luxon";

export interface SettingsDto {
    id: number;
    uuid: string;
    user_uuid: string;
    notifications: number;
    todayNotifications: number;
    notificationTime: Date | null;
}

export type SettingsAddDto = Omit<SettingsDto, 'id'>;
