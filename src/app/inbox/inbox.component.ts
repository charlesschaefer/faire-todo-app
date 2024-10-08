import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { ChipsModule } from 'primeng/chips';
import { CardModule } from 'primeng/card';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';
import { CalendarModule } from 'primeng/calendar';

import { TaskListComponent } from "../task/task-list/task-list.component";
import { TaskDto } from '../dto/task-dto';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskService } from '../services/task.service';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';


@Component({
    selector: 'app-inbox',
    standalone: true,
    imports: [
        DataViewModule,
        CommonModule,
        ButtonModule,
        RadioButtonModule,
        FormsModule,
        ReactiveFormsModule,
        OverlayPanelModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputTextModule,
        ChipsModule,
        CardModule,
        InputTextareaModule,
        DividerModule,
        CalendarModule,
        TaskListComponent,
        TaskAddComponent,
        TranslateModule,
    ],
    templateUrl: './inbox.component.html',
    styleUrl: './inbox.component.scss'
})
export class InboxComponent implements OnInit {
    tasks!: TaskDto[];
    subtasksCount!: Map<number, number>;

    showTaskAddOverlay$ = new Subject<Event>();

    constructor(
        protected taskService: TaskService<TaskDto>,
        protected activatedRoute: ActivatedRoute,
    ) {}
    
    ngOnInit() {
        this.getTasks();
    }

    onShowTaskAddOverlay(event: Event) {
        this.showTaskAddOverlay$.next(event);
    }

    getTasks() {
        this.activatedRoute.data.subscribe((inboxResolvedData) => {
            this.tasks = inboxResolvedData['tasks'].tasks;
            this.subtasksCount = inboxResolvedData['tasks'].subtasksCount;
        });
    }

    async countSubtasks() {
        if (this.tasks) {
            this.subtasksCount = await this.taskService.countTasksSubtasks(this.tasks);
        }
    }

    onAddTask() {
        this.getTasks();
    }
    
    onEditTask() {
        console.log("called Inbox.onEditTask()");
        this.getTasks();
    }
}
