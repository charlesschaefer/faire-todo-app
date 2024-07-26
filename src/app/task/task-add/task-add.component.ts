import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { Subject } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { TaskAddDto, TaskDto } from '../../dto/task-dto';

@Component({
    selector: 'app-task-add',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        OverlayPanelModule,
        CardModule,
        CalendarModule,
        InputTextareaModule,
        DividerModule,
    ],
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input() showOverlay$!: Subject<Event>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();
    @ViewChild('taskAddOp') taskAddOp!: OverlayPanel;

    private fb = inject(FormBuilder);
    taskForm = this.fb.group({
        title: [null, Validators.required],
        description: [null],
        dueDate: [null],
    });

    constructor(
        private taskService: TaskService<TaskAddDto>
    ) {}

    ngOnInit(): void {
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        })
    }

    onClose(event: Event) {
        this.showOverlay$.next(event);
        this.showOverlay$Change.emit(this.showOverlay$);
    }

    saveTask() {

    }
}
