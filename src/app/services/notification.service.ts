import { Injectable } from '@angular/core';
import { SettingsDto } from '../dto/settings-dto';
import { TranslateService } from '@ngx-translate/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { TaskService } from './task.service';
import { TaskDto } from '../dto/task-dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private unlisten: Function | undefined;

    constructor (
        private translate: TranslateService,
        private taskService: TaskService<TaskDto>
    ) { }

    async setup(settings: SettingsDto) {
        console.log("Setting up notifications")
        const settingsObj = {
            // time of day to notify today tasks [hours, minutes]
            time_to_notify_today_tasks: [0, 0],
            send_notifications: !!settings?.notifications,
            send_today_notifications: false,
            notification_title: await firstValueFrom(this.translate.get('Task duing')),
            notification_body: await firstValueFrom(this.translate.get(`The task "{{title}}" is dueing now.`, {title: "{title}"}))
        }
        if (settings?.notifications) {
            if (settings.todayNotifications && settings.notificationTime) {
                settingsObj.send_today_notifications = true;
                settingsObj.time_to_notify_today_tasks = [
                    settings.notificationTime.getHours(),
                    settings.notificationTime.getMinutes()
                ];
            }
            if (!this.unlisten) {
                // this.unlisten = await listen('get-due-tasks', (event) => {
                //     this.checkDuedTasks();
                // });
            }
        }
        console.log("Settings object: ", settingsObj);
        invoke('start_notification_daemon', {settings: settingsObj});
    }

    checkDuedTasks() {
        const date = new Date;
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
    
        const time = new Date;
    
        this.taskService.getByField('dueDate', date).subscribe(tasks => {
            let duingTasks: {tasks: {title: string}[]} = {tasks: []};
            duingTasks = tasks.reduce((acc, task) => {
                if (task.dueTime?.getHours() == time.getHours() && task.dueTime?.getMinutes() == time.getMinutes()) {
                    console.log(`We need to notify user that ${task.title} task is duing now`);
                    // task dueing now, notifying the user
                    acc.tasks.push({title: task.title});
                }
                return acc;
            }, duingTasks);
            invoke('set_due_tasks', {dueTasks: duingTasks});
        })
    }

    updateTimeToNotifyTodayTasks(settings: SettingsDto) {
        const time_to_notify_today_tasks = [
            settings.notificationTime?.getHours(),
            settings.notificationTime?.getMinutes()
        ];
        invoke('update_time_to_notify_today_tasks', {time_to_notify_today_tasks});
    }
}