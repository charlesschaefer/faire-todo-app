import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DataViewModule } from 'primeng/dataview';
import { OverlayPanel } from 'primeng/overlaypanel';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { TaskComponent } from '../task/task.component';
import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../../services/task.service';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [
        DataViewModule,
        TaskComponent,
        CdkDropList,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
    @Input() tasks!: TaskDto[];
    @Output() showTaskAdd = new EventEmitter<Event>();

    constructor(
        private taskService: TaskService<TaskDto>,
    ) {}

    showTaskAddPanel(event: Event) {
        this.showTaskAdd.emit(event);
    }

    onTaskRemoved(id: number) {
        console.log("On task removed Id: ", id);
        let newTasks:TaskDto[] = [];
        this.tasks.forEach(task => {
            if (task.id != id) {
                newTasks.push(task);
            }
        });
        this.tasks = newTasks;
    }

    onTaskOrder(event: CdkDragDrop<TaskDto[]>) {
        console.log("OnTaskORder");
        moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
        this.tasks.forEach((task, index) => {
            task.order = index;
            this.taskService.edit(task).subscribe({
                error: err => console.error(err)
            });
        });
    }
}
