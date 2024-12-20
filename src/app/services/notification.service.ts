import { Injectable } from '@angular/core';
import { SettingsDto } from '../dto/settings-dto';
import { TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { TaskService } from './task.service';
import { TaskDto } from '../dto/task-dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private unlistenDue: Function | undefined;
    private unlistenToday: Function | undefined;

    constructor (
        private translate: TranslocoService,
        private taskService: TaskService
    ) { }

    async setup(settings: SettingsDto) {
        console.log("Setting up notifications")
        const settingsObj = {
            // time of day to notify today tasks [hours, minutes]
            time_to_notify_today_tasks: [0, 0],
            send_notifications: !!settings?.notifications,
            send_today_notifications: false,
            notification_title: await firstValueFrom(this.translate.selectTranslate('Task duing')),
            notification_body: await firstValueFrom(this.translate.selectTranslate(`The task "{{title}}" is duing now.`, {title: "{title}"}))
        }
        if (settings?.notifications) {
            if (settings.todayNotifications && settings.notificationTime) {
                settingsObj.send_today_notifications = true;
                settingsObj.time_to_notify_today_tasks = [
                    settings.notificationTime.getHours(),
                    settings.notificationTime.getMinutes()
                ];

                if (!this.unlistenToday) {
                    this.unlistenToday = await listen('get-today-tasks', (event) => {
                        this.checkTodayTasks();
                    });
                }
            }
            if (!this.unlistenDue) {
                this.unlistenDue = await listen('get-due-tasks', (event) => {
                    this.checkDuedTasks();
                });
            }
        }
        console.log("Settings object: ", settingsObj);
        invoke('start_notification_daemon', {settings: settingsObj});
    }

    checkDuedTasks() {
        const date = new Date;
        date.setHours(0, 0, 0, 0);
        
    
        const time = new Date;
    
        this.taskService.getByField('dueDate', date).subscribe(tasks => {
            let duingTasks: {tasks: {title: string}[]} = {tasks: []};
            duingTasks = tasks.reduce((acc, task) => {
                if (task.dueTime?.getHours() == time.getHours() && task.dueTime?.getMinutes() == time.getMinutes()) {
                    console.log(`We need to notify user that ${task.title} task is duing now`);
                    // task duing now, notifying the user
                    acc.tasks.push({title: task.title});
                }
                return acc;
            }, duingTasks);
            invoke('set_due_tasks', {dueTasks: duingTasks});
        })
    }

    checkTodayTasks() {
        const initial = new Date;
        initial.setHours(0, 0, 0, 0);

        const final = new Date;
        final.setHours(23, 59, 59, 999);

        this.taskService.getByDate('dueDate', initial, final).subscribe(tasks => {
            let duingTasks: {tasks: {title: string}[]} = {tasks: []};
            duingTasks = tasks.reduce((acc, task) => {
                console.log(`We need to notify user that ${task.title} task is duing now`);
                // task duing today, notifying the user
                acc.tasks.push({title: task.title});
                return acc;
            }, duingTasks);
            invoke('set_today_tasks', {todayTasks: duingTasks});
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