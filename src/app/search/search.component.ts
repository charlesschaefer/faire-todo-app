import { Component, OnInit } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';


import { TaskListComponent } from "../task/task-list/task-list.component";
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

    completedTasks!: TaskDto[];

    constructor(
        protected override taskService: TaskService,
        protected override activatedRoute: ActivatedRoute,
    ) {
        super(taskService, activatedRoute);
    }

    override async ngOnInit() { 
        console.log("")
    }

    async search() {
        let tasks = await firstValueFrom(this.taskService.slowStringSearch('title', this.searchValue));
        
        const completedTasks: TaskDto[] = [];
        tasks = this.taskService.orderTasksByCompletion(tasks as TaskDto[]);
        // we trust that all the completed tasks are going to be in the end of the array
        // and that when we find an incomplete task all tasks before will be incomplete (so we break the loop)
        for (let i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].completed) {
                const task = tasks.pop();
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
