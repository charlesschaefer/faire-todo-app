import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, input, Input, OnInit, Output, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { RippleModule } from 'primeng/ripple';
import { SpeedDialModule } from 'primeng/speeddial';

import { ProjectDto } from '../../dto/project-dto';
import { TaskDto } from '../../dto/task-dto';
import { ProjectService } from '../../project/project.service';
import { TaskService } from '../task.service';
import { TaskComponent } from '../task/task.component';


@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [
        TaskComponent,
        CdkDropList,
        PanelModule,
        TranslocoModule,
        SpeedDialModule,
        ButtonModule,
        RippleModule,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
    _inputTasks = signal<TaskDto[]>([]);
    @Input() set tasks(tasks) {
        this._inputTasks.set(tasks);
    }
    get tasks() {
        return this._inputTasks();
    }

    _inputCompletedTasks = signal<TaskDto[]>([]);
    @Input() set completedTasks(tasks) {
        this._inputCompletedTasks.set(tasks);
    }

    get completedTasks() {
        return this._inputCompletedTasks();
    }

    subtasksCount = input<Map<string, number>>();

    @Output() showTaskAdd = new EventEmitter<Event>();
    @Output() taskEditEvent = new EventEmitter();
    @Input() showAddTask = true;

    projects = signal<Map<string, ProjectDto>>(new Map<string, ProjectDto>());

    speedDialItems = [{
        icon: 'pi pi-plus',
        command: ($event: any) => this.showTaskAddPanel($event)
    }];

    constructor(
        private taskService: TaskService,
        private projectService: ProjectService,
    ) { }

    ngOnInit(): void {
        this.projectService.list().then((projects) => {
            const indexedProjects = new Map<string, ProjectDto>();
            projects.forEach(project => indexedProjects.set(project.uuid, project as ProjectDto));
            this.projects.set(indexedProjects);
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
        this._inputTasks?.set(newTasks);
    }

    onTaskOrder(event: CdkDragDrop<TaskDto[]>) {
        const tasks = this.tasks;
        moveItemInArray(tasks, event.previousIndex, event.currentIndex);
        tasks.forEach((task, index) => {
            task.order = index;
            this.taskService.edit(task.uuid, task).subscribe({
                error: err => console.error(err)
            });
        });
        this._inputTasks?.set(tasks);
    }

    onTaskEdit() {
        console.log("TaskList.onTaskEdit emitted");
        this.taskEditEvent.emit();
    }
}
