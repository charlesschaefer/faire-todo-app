import { Component, OnInit } from '@angular/core';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { firstValueFrom } from 'rxjs';
import { InboxComponent } from '../inbox/inbox.component';
import { DateTime } from 'luxon';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-today',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule,
        CardModule,
        ButtonModule,
    ],
    templateUrl: './today.component.html',
    styleUrl: './today.component.scss'
})

// Extends InboxComponent to receive the same methods that we're going to use here
export class TodayComponent extends InboxComponent implements OnInit {
    
    today = DateTime.fromJSDate(new Date());

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getForToday());
        this.tasks = this.taskService.orderTasks(tasks);
        this.countSubtasks();

        this.separateDueTasks();
    }
}
