import { Component, OnInit } from '@angular/core';
import { DateTime } from 'luxon';

import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { InboxComponent } from '../inbox/inbox.component';

@Component({
    selector: 'app-upcoming',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
    ],
    templateUrl: './upcoming.component.html',
    styleUrl: './upcoming.component.scss'
})
export class UpcomingComponent extends InboxComponent implements OnInit {
    override async ngOnInit() {
        this.getTasks();
    }

    override getTasks(): void {
        let minDate = DateTime.fromJSDate(new Date).endOf('day').toJSDate();
        this.taskService.getByDate('dueDate', minDate).subscribe(tasks => {
            // now filter only tasks not completed
            let filteredTasks = tasks.filter(task => task.completed == 0);
            this.tasks = this.taskService.orderTasks(filteredTasks);
        });
    }
}
