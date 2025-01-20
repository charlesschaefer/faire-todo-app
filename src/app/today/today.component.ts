import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';


import { InboxComponent } from '../inbox/inbox.component';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { SubtitlePipe } from '../pipes/subtitle.pipe';

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
        AccordionModule
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
