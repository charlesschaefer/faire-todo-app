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

    constructor(
        protected override taskService: TaskService<TaskDto>,
    ) {
        super(taskService);
    }

    override async ngOnInit() { }

    search() {
        console.log('chamou search', this.searchValue);
        this.taskService.slowStringSearch('title', this.searchValue).subscribe(tasks => this.tasks = tasks as TaskDto[]);
    }
}
