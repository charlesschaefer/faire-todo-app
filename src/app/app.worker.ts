/// <reference lib="webworker" />
import { firstValueFrom } from "rxjs";

import { TaskDto } from "./dto/task-dto";
import { TaskService } from "./services/task.service";
import { SettingsService } from "./services/settings.service";
import { NotificationType } from "./app.component";
import { SettingsDto } from "./dto/settings-dto";
import { DbService } from "./services/db.service";

addEventListener('message', (message) => {

    // checks if the message is coming from the main window
    if (message.origin.indexOf(import.meta.url) === -1) {
        return;
    }

    const dbService = new DbService();
    const settingsService = new SettingsService(dbService);
    // checks if there are tasks dueing now every minute
    setInterval(() => {
        console.log("Checking if we need to notify about any task...");
        settingsService.get(1).subscribe(settings => {
            if (settings?.notifications) {
                checkDuedTasks();
                if (settings.todayNotifications) {
                    checkDuingToday(settings);
                }
            }
        });
    }, 60000)

    //const response = `worker response to ${data}`;
    //postMessage(response);
});

function checkDuedTasks() {
    const date = new Date;
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const time = new Date;

    const dbService = new DbService();
    const taskService = new TaskService<TaskDto>(dbService);
    taskService.getByField('dueDate', date).subscribe(tasks => {
        tasks.forEach(task => {
            if (task.dueTime?.getHours() == time.getHours() && task.dueTime?.getMinutes() == time.getMinutes()) {
                console.log(`We need to notify user that ${task.title} task is duing now`);
                // task dueing now, notifying the user
                postMessage({
                    task: task,
                    type: NotificationType.DueTask
                });
            }
        })
    })
}

function checkDuingToday(settings: SettingsDto) {
    const date = new Date;
    
    if (
        settings.notificationTime?.getHours() == date.getHours() &&
        settings.notificationTime?.getMinutes() == date.getMinutes()
    ) {
        console.log("Notifying the user that they have tasks duing today");
        postMessage({
            type: NotificationType.TodayTasks
        });
    }
}