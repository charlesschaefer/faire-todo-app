import { Component } from '@angular/core';
import { InboxComponent } from '../inbox/inbox.component';
import { TaskService } from '../services/task.service';
import { TaskDto } from '../dto/task-dto';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';

@Component({
    selector: 'app-all-tasks',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
    ],
    templateUrl: './all-tasks.component.html',
    styleUrl: './all-tasks.component.scss'
})
export class AllTasksComponent  extends InboxComponent {
    
    constructor(
        protected override taskService: TaskService<TaskDto>,
    ) {
        super(taskService);
    }

    override getTasks(): void {
        this.taskService.getByField('completed', 0).subscribe(tasks => {
            console.log("Got tasks", tasks);
            this.tasks = this.taskService.orderTasks(tasks);
        })
    }
}
