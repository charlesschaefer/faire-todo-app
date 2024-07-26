import { Component, OnInit } from '@angular/core';
import { TaskListComponent } from '../task/task-list/task-list.component';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskDto } from '../dto/task-dto';
import { Subject } from 'rxjs';
import { TaskService } from '../services/task.service';
import { InboxComponent } from '../inbox/inbox.component';

@Component({
    selector: 'app-today',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
    ],
    templateUrl: './today.component.html',
    styleUrl: './today.component.scss'
})

// Extends InboxComponent to receive the same methods that we're going to use here
export class TodayComponent extends InboxComponent implements OnInit {
    
    override ngOnInit(): void {
        let date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        this.taskService.getByField('dueDate', date).subscribe(tasks => this.tasks = tasks);

        this.taskService.slowStringSearch('title', 'today').subscribe(results => {
            console.log("Results final: ", results);
        })
    }
}
