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

    override getTasks(): void {
        this.taskService.getUpcoming().subscribe(tasks => {
            // now filter only tasks not completed
            this.tasks = this.taskService.orderTasks(tasks);
        });
    }
}
