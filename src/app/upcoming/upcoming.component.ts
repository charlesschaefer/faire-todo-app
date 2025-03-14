import { Component, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { firstValueFrom } from 'rxjs';

import { TaskDto } from '../dto/task-dto';
import { InboxComponent } from '../inbox/inbox.component';
import { SubtitlePipe } from '../pipes/subtitle.pipe';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

@Component({
    selector: 'app-upcoming',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule,
        CardModule,
        ButtonModule,
        SubtitlePipe,
        PanelModule,
        BadgeModule,
        OverlayBadgeModule,
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
        
        // Count attachments for tasks
        this.taskService.countAttachmentsForTasks(this.tasks()).subscribe((counts) => {
            this.attachmentsCount = counts;
        });
        
        this.countSubtasks();
    }
}
