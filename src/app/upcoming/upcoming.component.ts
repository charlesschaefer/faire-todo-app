import { Component, OnInit } from '@angular/core';

import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { InboxComponent } from '../inbox/inbox.component';
import { firstValueFrom } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { TaskDto } from '../dto/task-dto';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SubtitlePipe } from '../pipes/subtitle.pipe';

@Component({
    selector: 'app-upcoming',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule,
        CardModule,
        ButtonModule,
        SubtitlePipe
    ],
    templateUrl: '../inbox/inbox.component.html',
    styleUrl: '../inbox/inbox.component.scss'
})
export class UpcomingComponent extends InboxComponent implements OnInit {
    override pageTitle = 'Upcoming tasks';

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getUpcoming());
    
        // now filter only tasks not completed
        this.tasks.set(this.taskService.orderTasks(tasks) as TaskDto[]);
        this.countSubtasks();
    }
}
