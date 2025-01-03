import { Component } from '@angular/core';
import { InboxComponent } from '../inbox/inbox.component';
import { TaskService } from '../task/task.service';
import { TaskDto } from '../dto/task-dto';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DataUpdatedService } from '../services/data-updated.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SubtitlePipe } from '../pipes/subtitle.pipe';

@Component({
    selector: 'app-all-tasks',
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
export class AllTasksComponent  extends InboxComponent {
    
    override pageTitle = 'All Tasks';

    constructor(
        protected override taskService: TaskService,
        protected override activatedRoute: ActivatedRoute,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(taskService, activatedRoute, dataUpdatedService);
    }

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getAllTasks());
        
        this.tasks.set(this.taskService.orderTasks(tasks) as TaskDto[]);
        this.countSubtasks();

        this.separateDueTasks();
    }
}
