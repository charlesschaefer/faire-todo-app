import { Component, inject, OnInit } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';

import { TaskDto } from '../../dto/task-dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ProjectDto } from '../../dto/project-dto';

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
        TranslateModule,
        DropdownModule,
    ],
    templateUrl: './task-edit.component.html',
    styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit {
    task!: TaskDto;

    projects!: ProjectDto[];
    
    private fb = inject(FormBuilder);
    taskForm!: FormGroup;

    constructor(
        private dynamicDialogConfig: DynamicDialogConfig,
        private taskService: TaskService<TaskDto>,
        private messageService: MessageService,
        private dynamicDialogRef: DynamicDialogRef,
        private translate: TranslateService,
        private projectService: ProjectService<ProjectDto>,
    ) {}

    ngOnInit(): void {
        this.task = this.dynamicDialogConfig.data.task;
        this.taskForm = this.fb.group({
            title: [this.task.title, Validators.required],
            description: [this.task.description],
            dueDate: [this.task.dueDate],
            dueTime: [this.task.dueTime],
            project: [this.task.project != null ? this.task.project : 0],
        });
        
        this.dynamicDialogConfig.data.saveSubject$.subscribe(() => {
            this.saveTask();
        });

        this.projectService.list().subscribe(projects => {
            let cloneProjects = projects.slice();

            if (cloneProjects[0].id != 0) {
                cloneProjects.unshift({
                    id: 0,
                    name: "Inbox"
                });
            }
            this.projects = cloneProjects;
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
            project: form.project || 0,
            completed: 0,
            order: this.task.order,
            parent: 0,
        };

        this.taskService.edit(this.task.id, saveData).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Saved successfully`)),
                    detail: await firstValueFrom(this.translate.get(`The task was saved successfully`)),
                    severity: "success"
                });
                this.dynamicDialogRef.close(saveData);
                // triggers a chain of events until it reaches Inbox class
                this.dynamicDialogConfig.data.onSaveEditTask$.next();
            },
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Error`)),
                    detail: await firstValueFrom(this.translate.get(`Couldn't save the task.`)) + err,
                    severity: "error"
                });
            }
        });
    }
}
