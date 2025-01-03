import { Component, computed, linkedSignal, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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

    projectId = signal<string>(this.route.snapshot.paramMap.get("id") || '');
    override project: WritableSignal<ProjectDto> = linkedSignal(() =>  ({name: this.translate.translate('Inbox'), uuid: this.projectId()} as ProjectDto));
    projectName = computed(() => this.project().name || '');
    override pageTitle = 'Project:';
    override pageSubtitle = this.projectName();

    constructor(
        private projectService: ProjectService,
        protected override taskService: TaskService,
        private route: ActivatedRoute,
        private router: Router,
        protected override activatedRoute: ActivatedRoute,
        protected override dataUpdatedService: DataUpdatedService,
        protected translate: TranslocoService,
    ) {
        super(taskService, activatedRoute, dataUpdatedService);
    }

    override async ngOnInit() {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;

        this.projectId.set(this.route.snapshot.paramMap.get("id") as string);

        const project = await this.projectService.get(this.projectId()) as ProjectDto;
        this.project.set(project);
        
        this.pageSubtitle = this.projectName();
        super.ngOnInit();
    }

    override async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getProjectTasks(this.project()?.uuid));
        // now filter only tasks not completed
        const filteredTasks = tasks.filter(task => task.completed == 0);
        this.tasks.set(this.taskService.orderTasks(filteredTasks) as TaskDto[]);
        this.countSubtasks();

        this.separateDueTasks();
    }

}
