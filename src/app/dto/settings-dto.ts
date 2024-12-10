import { UserBound } from "../services/service.abstract";

export interface SettingsDto {
    id: number;
    uuid: string;
    user_uuid: string;
    notifications: number;
    todayNotifications: number;
    notificationTime: Date | null;
    updated_at?: Date;
}

export type SettingsAddDto = Omit<SettingsDto, 'id'> & UserBound;
