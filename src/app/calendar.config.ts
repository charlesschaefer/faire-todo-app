import { DateTime } from 'luxon';
import { CalendarConfig, WorkingHours, CalendarViewType } from 'ngx-calendar-view';

export const CALENDAR_CONFIG: CalendarConfig = {
  defaultDuration: 30, // 30 minutes default task duration
  defaultViewType: CalendarViewType.DAY, // Week view by default
  defaultViewDate: DateTime.now(),
  showViewTypeSelector: true,
  timeSlotDuration: 30, // 30-minute time slots
  maxEventsPerDay: 10,
  workingHours: {
    startHour: 8,
    startMinute: 0,
    endHour: 18,
    endMinute: 0
  } as WorkingHours
};
