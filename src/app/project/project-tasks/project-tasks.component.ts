import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';


import { TaskListComponent } from '../../task/task-list/task-list.component';
import { TaskAddComponent } from '../../task/task-add/task-add.component';
import { ProjectService } from '../project.service';
import { ProjectDto } from '../../dto/project-dto';
import { TaskService } from '../../task/task.service';
import { TaskDto } from '../../dto/task-dto';
import { InboxComponent } from '../../inbox/inbox.component';
import { CommonModule } from '@angular/common';
import { DataUpdatedService } from '../../services/data-updated.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SubtitlePipe } from '../../pipes/subtitle.pipe';


@Component({
    selector: 'app-project-tasks',
    standalone: true,
    imports: [
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule,
        CommonModule,
        CardModule,
        ButtonModule,
        SubtitlePipe
    ],
    templateUrl: '../../inbox/inbox.component.html',
    styleUrl: '../../inbox/inbox.component.scss'
})
export class ProjectTasksComponent extends InboxComponent implements OnInit {

    project!: ProjectDto;
    
    override pageTitle = 'Project:';
    override pageSubtitle = this.project?.name;

    constructor(
        private projectService: ProjectService,
        protected override taskService: TaskService,
        private route: ActivatedRoute,
        private router: Router,
        protected override activatedRoute: ActivatedRoute,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(taskService, activatedRoute, dataUpdatedService);
    }

    override async ngOnInit() {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;

        const projectId = this.route.snapshot.paramMap.get("id") as string;
        this.project = await this.projectService.get(projectId) as ProjectDto;
        this.pageSubtitle = this.project.name;
        super.ngOnInit();
    }

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getProjectTasks(this.project.uuid));
        // now filter only tasks not completed
        const filteredTasks = tasks.filter(task => task.completed == 0);
        this.tasks = this.taskService.orderTasks(filteredTasks) as TaskDto[];
        this.countSubtasks();

        this.separateDueTasks();
    }

}
