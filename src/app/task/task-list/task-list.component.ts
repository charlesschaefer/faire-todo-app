import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataViewModule } from 'primeng/dataview';
import { OverlayPanel } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { TranslateModule } from '@ngx-translate/core';

import { TaskComponent } from '../task/task.component';
import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { ProjectDto } from '../../dto/project-dto';


@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [
        DataViewModule,
        TaskComponent,
        CdkDropList,
        PanelModule,
        TranslateModule,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
    @Input() tasks!: TaskDto[];
    @Input() completedTasks!: TaskDto[];

    @Output() showTaskAdd = new EventEmitter<Event>();
    @Output() onEditTask = new EventEmitter();
    @Input() showAddTask: boolean = true;

    projects!: Map<number, ProjectDto>;

    constructor(
        private taskService: TaskService<TaskDto>,
        private projectService: ProjectService<ProjectDto>,
    ) {}

    ngOnInit(): void {
        this.projectService.list().subscribe((projects: ProjectDto[]) => {
            let indexedProjects:Map<number, ProjectDto> = new Map();
            projects.forEach(project => indexedProjects.set(project.id, project));
            this.projects = indexedProjects;
        });
    }

    showTaskAddPanel(event: Event) {
        this.showTaskAdd.emit(event);
    }

    onTaskRemoved(id: number) {
        let newTasks:TaskDto[] = [];
        this.tasks.forEach(task => {
            if (task.id != id) {
                newTasks.push(task);
            }
        });
        this.tasks = newTasks;
    }

    onTaskOrder(event: CdkDragDrop<TaskDto[]>) {
        moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
        this.tasks.forEach((task, index) => {
            task.order = index;
            this.taskService.edit(task.id, task).subscribe({
                error: err => console.error(err)
            });
        });
    }

    onTaskEdit() {
        console.log("TaskList.onTaskEdit emitted");
        this.onEditTask.emit();
    }
}
