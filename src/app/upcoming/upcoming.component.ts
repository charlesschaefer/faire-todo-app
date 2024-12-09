import { Component, OnInit } from '@angular/core';
import { DateTime } from 'luxon';

import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { InboxComponent } from '../inbox/inbox.component';
import { firstValueFrom } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-upcoming',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule
    ],
    templateUrl: './upcoming.component.html',
    styleUrl: './upcoming.component.scss'
})
export class UpcomingComponent extends InboxComponent implements OnInit {

    override async getTasks() {
        let tasks = await firstValueFrom(this.taskService.getUpcoming());
    
        // now filter only tasks not completed
        this.tasks = this.taskService.orderTasks(tasks);
        this.countSubtasks();
    }
}
