import { Updatable } from "./updatable";
import { UserBound } from "./user-bound";

export interface SettingsDto extends Updatable {
  id: number;
  uuid: string;
  user_uuid: string;
  notifications: number;
  todayNotifications: number;
  notificationTime: Date | null;
  updated_at?: Date;
  autostart?: number;
}

export type SettingsAddDto = Omit<SettingsDto, "id"> & UserBound;
