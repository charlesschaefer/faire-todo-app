import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
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
        ToastModule,
    ],
    providers: [
        MessageService,
    ],
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input() showOverlay$!: Subject<Event>;
    @Output() onAddTask = new EventEmitter<any>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();
    @ViewChild('taskAddOp') taskAddOp!: OverlayPanel;

    private fb = inject(FormBuilder);
    taskForm = this.fb.group({
        title: [null, Validators.required],
        description: [null],
        dueDate: [null],
        dueTime: [null],
    });

    constructor(
        private taskAddService: TaskService<TaskAddDto>,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        // subscribes to the parent Subject to exhibit the overlay component
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        });
    }

    onClose(event: Event) {
        this.showOverlay$.next(event);
        this.showOverlay$Change.emit(this.showOverlay$);
    }

    saveTask() {
        const form = this.taskForm.value;
        
        const saveData: TaskAddDto = {
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: form.dueDate || null,
            dueTime: form.dueTime || null,
            project: null,
        };

        this.taskAddService.add(saveData).subscribe({
            complete: () => {
                this.messageService.add({
                    summary: $localize `Saved successfully`,
                    detail: $localize `The task was saved successfully`,
                    severity: "success"
                });
                this.taskAddOp.hide();
                this.onAddTask.emit();
            },
            error: (err) => {
                this.messageService.add({
                    summary: $localize `Error`,
                    detail: $localize `Couldn't save the task. ${err}`,
                    severity: "error"
                });
            }
        });
    }
}
