import { AfterContentInit, AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';

import { TaskDto } from '../../dto/task-dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-task-edit',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CardModule,
        CalendarModule,
        InputTextareaModule,
        DividerModule,
        DynamicDialogModule,
    ],
    templateUrl: './task-edit.component.html',
    styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit {
    task!: TaskDto;
    
    private fb = inject(FormBuilder);
    taskForm!: FormGroup;

    constructor(
        private dynamicDialogConfig: DynamicDialogConfig,
        private taskService: TaskService<TaskDto>,
        private messageService: MessageService,
        private dynamicDialogRef: DynamicDialogRef,
    ) {}

    ngOnInit(): void {
        this.task = this.dynamicDialogConfig.data.task;
        this.taskForm = this.fb.group({
            title: [this.task.title, Validators.required],
            description: [this.task.description],
            dueDate: [this.task.dueDate],
            dueTime: [this.task.dueTime],
            project: [this.task.project],
        });

        this.dynamicDialogConfig.data.saveSubject$.subscribe(() => {
            this.saveTask();
        });
    }

    saveTask() {
        const form = this.taskForm.value;
        const saveData: TaskDto = {
            id: this.task.id,
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: form.dueDate || null,
            dueTime: form.dueTime || null,
            project: null,
        };

        this.taskService.edit(saveData).subscribe({
            complete: () => {
                this.messageService.add({
                    summary: $localize `Saved successfully`,
                    detail: $localize `The task was saved successfully`,
                    severity: "success"
                });
                this.dynamicDialogRef.close(saveData);
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
