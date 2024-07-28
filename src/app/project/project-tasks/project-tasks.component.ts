import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';


import { TaskListComponent } from '../../task/task-list/task-list.component';
import { TaskAddComponent } from '../../task/task-add/task-add.component';
import { ProjectService } from '../../services/project.service';
import { ProjectDto } from '../../dto/project-dto';
import { TaskService } from '../../services/task.service';
import { TaskDto } from '../../dto/task-dto';
import { InboxComponent } from '../../inbox/inbox.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-project-tasks',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslateModule,
        CommonModule,
    ],
    templateUrl: './project-tasks.component.html',
    styleUrl: './project-tasks.component.scss'
})
export class ProjectTasksComponent extends InboxComponent implements OnInit {

    project!: ProjectDto;

    constructor(
        private projectService: ProjectService<ProjectDto>,
        protected override taskService: TaskService<TaskDto>,
        private route: ActivatedRoute,
    ) {
        super(taskService);
    }

    override async ngOnInit() {
        const projectId = Number(this.route.snapshot.paramMap.get("id"));
        this.project = await firstValueFrom(this.projectService.get(projectId));
        this.getTasks();
    }

    override getTasks(): void {
        this.taskService.getByField('project', this.project.id).subscribe(tasks => {

            // now filter only tasks not completed
            let filteredTasks = tasks.filter(task => task.completed == 0);
            this.tasks = this.taskService.orderTasks(filteredTasks);
        });
    }

}
