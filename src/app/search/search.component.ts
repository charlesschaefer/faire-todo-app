import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { TaskDto } from '../dto/task-dto';
import { InboxComponent } from '../inbox/inbox.component';
import { DataUpdatedService } from '../services/data-updated.service';
import { TaskListComponent } from "../task/task-list/task-list.component";
import { TaskService } from '../task/task.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [
        TaskListComponent,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ButtonModule,
        TranslocoModule,
        FormsModule,
    ],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent extends InboxComponent implements OnInit {
    searchValue!: string;

    completedTasks = signal<TaskDto[]>([]);

    constructor(
        protected override taskService: TaskService,
        protected override activatedRoute: ActivatedRoute,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(taskService, activatedRoute, dataUpdatedService);
    }

    override async ngOnInit() { 
        console.log("")
    }

    async search() {
        let tasks = await this.taskService.slowStringSearch('title', this.searchValue);
        
        const completedTasks: TaskDto[] = [];
        tasks = this.taskService.orderTasksByCompletion(tasks as TaskDto[]);
        // we trust that all the completed tasks are going to be in the end of the array
        // and that when we find an incomplete task all tasks before will be incomplete (so we break the loop)
        for (let i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].completed) {
                const task = tasks.pop();
                completedTasks.push(task as TaskDto);
            } else {
                break;
            }
        }
        this.tasks.set(tasks as TaskDto[]);
        this.completedTasks.set(completedTasks);
        this.countSubtasks();

    }
}
