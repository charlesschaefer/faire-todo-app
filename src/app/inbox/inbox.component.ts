import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DateTime } from 'luxon';
import { DataViewModule } from 'primeng/dataview';

@Component({
    selector: 'app-inbox',
    standalone: true,
    imports: [
        DataViewModule,
        CommonModule,
    ],
    templateUrl: './inbox.component.html',
    styleUrl: './inbox.component.scss'
})
export class InboxComponent {
    tasks = [
        {id: 1, title: 'Task 1', dueDate: DateTime.fromJSDate(new Date), description: "Description task 1", project: null, tag: null, category: null},
        {id: 2, title: 'Task 2', dueDate: DateTime.fromJSDate(new Date), description: "Description task 2", project: null, tag: null, category: null},
        {id: 3, title: 'Task 3', dueDate: DateTime.fromJSDate(new Date), description: "Description task 3", project: null, tag: null, category: null},
    ]
}
