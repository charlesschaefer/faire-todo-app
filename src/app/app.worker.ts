/// <reference lib="webworker" />

import { TaskDto } from "./dto/task-dto";
import { TaskService } from "./services/task.service";

addEventListener('message', ({ data }) => {
    
    // checks if there are tasks dueing now every minute
    setInterval(() => checkDueTasks(), 60000)

    //const response = `worker response to ${data}`;
    //postMessage(response);
});

function checkDueTasks() {
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
                    task: task
                });
            }
        })
    })
}