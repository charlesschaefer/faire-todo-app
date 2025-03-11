import { Component, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { DateTime } from 'luxon';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { firstValueFrom } from 'rxjs';


import { InboxComponent } from '../inbox/inbox.component';
import { SubtitlePipe } from '../pipes/subtitle.pipe';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

@Component({
    selector: 'app-today',
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

// Extends InboxComponent to receive the same methods that we're going to use here
export class TodayComponent extends InboxComponent implements OnInit {

    today = DateTime.fromJSDate(new Date());
    override pageTitle = 'Today';
    override pageSubtitle = this.today.toFormat('dd/MM');
    override subtitleModifier = 'small';

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getForToday());
        this.tasks.set(this.taskService.orderTasks(tasks));
        this.countSubtasks();

        this.separateDueTasks();
    }
}
