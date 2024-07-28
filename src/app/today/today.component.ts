import { Component, OnInit } from '@angular/core';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskDto } from '../dto/task-dto';
import { Subject } from 'rxjs';
import { TaskService } from '../services/task.service';
import { InboxComponent } from '../inbox/inbox.component';
import { DateTime } from 'luxon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-today',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslateModule,
    ],
    templateUrl: './today.component.html',
    styleUrl: './today.component.scss'
})

// Extends InboxComponent to receive the same methods that we're going to use here
export class TodayComponent extends InboxComponent implements OnInit {
    
    today = DateTime.fromJSDate(new Date());

    override async ngOnInit() {
        this.getTasks();
    }

    override getTasks(): void {
        this.taskService.getForToday().subscribe(tasks => {
            this.tasks = this.taskService.orderTasks(tasks);
        });
    }
}
