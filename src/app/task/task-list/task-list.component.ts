import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DataViewModule } from 'primeng/dataview';
import { OverlayPanel } from 'primeng/overlaypanel';

import { TaskComponent } from '../task/task.component';
import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../../services/task.service';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [
        DataViewModule,
        TaskComponent,
    ],
    templateUrl: './task-list.component.html',
    styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
    @Input() tasks!: TaskDto[];
    @Output() showTaskAdd = new EventEmitter<Event>();

    showTaskAddPanel(event: Event) {
        this.showTaskAdd.emit(event);
    }
}
