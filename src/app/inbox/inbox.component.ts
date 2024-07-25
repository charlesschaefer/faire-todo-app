import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
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
    ],
    templateUrl: './inbox.component.html',
    styleUrl: './inbox.component.scss'
})
export class InboxComponent {
    tasks: TaskDto[] = [
        {id: 1, title: 'Task 1', dueDate: DateTime.fromJSDate(new Date), description: "Description task 1", project: null, category: null},
        {id: 2, title: 'Task 2', dueDate: DateTime.fromJSDate(new Date), description: "Description task 2", project: null, category: null},
        {id: 3, title: 'Task 3', dueDate: DateTime.fromJSDate(new Date), description: "Description task 3", project: null, category: null},
    ];

    completedTasks: {[key: number]: number | null} = {
        1: null,
        2: null,
        3: null
    };

    showTaskAddOverlay$ = new Subject<Event>();

    onShowTaskAddOverlay(event: Event) {
        console.log("Teste");
        this.showTaskAddOverlay$.next(event);
    }
}
