/// <reference lib="webworker" />
import { firstValueFrom } from "rxjs";

import { TaskDto } from "./dto/task-dto";
import { TaskService } from "./services/task.service";
import { SettingsService } from "./services/settings.service";
import { NotificationType } from "./app.component";
import { SettingsDto } from "./dto/settings-dto";

addEventListener('message', ({ data }) => {
    const settingsService = new SettingsService();
    // checks if there are tasks dueing now every minute
    setInterval(() => {
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

    let taskService = new TaskService<TaskDto>();
    taskService.getByField('dueDate', date).subscribe(tasks => {
        tasks.forEach(task => {
            if (task.dueTime?.getHours() == time.getHours() && task.dueTime?.getMinutes() == time.getMinutes()) {
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
        postMessage({
            type: NotificationType.TodayTasks
        });
    }
}