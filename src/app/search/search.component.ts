import { Component } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


import { TaskListComponent } from "../task/task-list/task-list.component";
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { InboxComponent } from '../inbox/inbox.component';
import { TaskService } from '../services/task.service';
import { TaskDto } from '../dto/task-dto';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ButtonModule,
        TranslateModule,
        FormsModule,
    ],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent extends InboxComponent {
    searchValue!: string;

    completedTasks!: TaskDto[];

    constructor(
        protected override taskService: TaskService<TaskDto>,
        protected override activatedRoute: ActivatedRoute,
    ) {
        super(taskService, activatedRoute);
    }

    override async ngOnInit() { }

    async search() {
        let tasks = await firstValueFrom(this.taskService.slowStringSearch('title', this.searchValue));
        
        let completedTasks: TaskDto[] = [];
        tasks = this.taskService.orderTasksByCompletion(tasks as TaskDto[]);
        // we trust that all the completed tasks are going to be in the end of the array
        // and that when we find an incomplete task all tasks before will be incomplete (so we break the loop)
        for (let i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].completed) {
                let task = tasks.pop();
                completedTasks.push(task);
            } else {
                break;
            }
        }
        this.tasks = tasks;
        this.completedTasks = completedTasks;
        this.countSubtasks();
    }
}
