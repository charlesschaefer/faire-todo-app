import { DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { DividerModule } from 'primeng/divider';
import { firstValueFrom, Subject } from 'rxjs';
import { MessageService, TreeNode } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AccordionModule } from 'primeng/accordion';

import { TaskAddComponent } from '../task-add/task-add.component';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { ProjectDto } from '../../dto/project-dto';
import { TaskDto } from '../../dto/task-dto';
import { TaskComponent } from '../task/task.component';
import { SubtaskComponent } from '../subtask/subtask.component';

console.log("TaskComponent2", TaskComponent);

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
        TaskAddComponent,
        SubtaskComponent,
        AccordionModule,
        TaskComponent
    ],
    templateUrl: './task-edit.component.html',
    styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit {
    task!: TaskDto;
    subTasks!: TaskDto[];

    @Output() showTaskAdd = new EventEmitter<Event>();

    projects!: ProjectDto[];
    
    private fb = inject(FormBuilder);
    taskForm!: FormGroup;

    showTaskAddOverlay$ = new Subject<Event>();

    subtasksCount!: number;
    subtasksCompletedCount!: number;

    constructor(
        private dynamicDialogConfig: DynamicDialogConfig,
        private taskService: TaskService<TaskDto>,
        private messageService: MessageService,
        private dynamicDialogRef: DynamicDialogRef,
        private translate: TranslateService,
        private projectService: ProjectService<ProjectDto>,
    ) {

    }

    async ngOnInit() {
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

        this.taskService.getTaskSubtasks(this.task).subscribe(subtasks => {
            this.subTasks = subtasks;
        });

        this.taskService.countTaskSubtasks(this.task).subscribe(countSubtasks => {
            this.subtasksCount = countSubtasks.subtasks;
            this.subtasksCompletedCount = countSubtasks.completed;
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
            parent: this.task.parent,
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

    showTaskAddPanel(event: Event) {
        console.log("ShowTaskAddPanel called")
        //this.showTaskAdd.emit(event);
        this.showTaskAddOverlay$.next(event);
    }

    onAddTask() {
        console.log("Chamou TaskEdit.onAddTask(), agora tem que recarregar as subtarefas");
    }

    subtasksTitle() {
        const title = this.translate.instant("Subtasks");
        return title + ` (${this.subtasksCompletedCount}/${this.subtasksCount})`;
    }
}
