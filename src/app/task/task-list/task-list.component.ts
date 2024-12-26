import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataViewModule } from 'primeng/dataview';
import { PanelModule } from 'primeng/panel';
import { TranslocoModule } from '@jsverse/transloco';

import { TaskComponent } from '../task/task.component';
import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../task.service';
import { ProjectService } from '../../project/project.service';
import { ProjectDto } from '../../dto/project-dto';
import { ToastModule } from 'primeng/toast';


@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [
        DataViewModule,
        TaskComponent,
        CdkDropList,
        PanelModule,
        TranslocoModule,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
    @Input() tasks!: TaskDto[];
    @Input() completedTasks!: TaskDto[];

    @Output() showTaskAdd = new EventEmitter<Event>();
    @Output() onEditTask = new EventEmitter();
    @Input() showAddTask = true;

    projects!: Map<string, ProjectDto>;

    constructor(
        private taskService: TaskService,
        private projectService: ProjectService,
    ) {}

    ngOnInit(): void {
        this.projectService.list().then((projects) => {
            const indexedProjects = new Map<string, ProjectDto>();
            projects.forEach(project => indexedProjects.set(project.uuid, project as ProjectDto));
            this.projects = indexedProjects;
        });
    }

    showTaskAddPanel(event: Event) {
        this.showTaskAdd.emit(event);
    }

    onTaskRemoved(uuid: string) {
        const newTasks:TaskDto[] = [];
        this.tasks.forEach(task => {
            if (task.uuid != uuid) {
                newTasks.push(task);
            }
        });
        this.tasks = newTasks;
    }

    onTaskOrder(event: CdkDragDrop<TaskDto[]>) {
        moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
        this.tasks.forEach((task, index) => {
            task.order = index;
            this.taskService.edit(task.uuid, task).subscribe({
                error: err => console.error(err)
            });
        });
    }

    onTaskEdit() {
        console.log("TaskList.onTaskEdit emitted");
        this.onEditTask.emit();
    }
}
