import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InplaceModule } from 'primeng/inplace';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { ProjectDto } from '../../dto/project-dto';
import { RecurringType, TaskDto } from '../../dto/task-dto';
import { LinkifyPipe } from '../../pipes/linkify.pipe';
import { ProjectService } from '../../project/project.service';
import { SubtaskComponent } from '../subtask/subtask.component';
import { TaskAddComponent } from '../task-add/task-add.component';
import { TaskService } from '../task.service';

import nlp from 'compromise';
import dates, { DatesMethods } from 'compromise-dates';
import { DataUpdatedService } from '../../services/data-updated.service';
nlp.plugin(dates);

@Component({
    selector: 'app-task-edit',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CardModule,
        DatePickerModule,
        TextareaModule,
        DividerModule,
        TranslocoModule,
        SelectModule,
        TaskAddComponent,
        AccordionModule,
        CheckboxModule,
        FormsModule,
        InplaceModule,
        LinkifyPipe,
        SubtaskComponent,
    ],
    templateUrl: './task-edit.component.html',
    styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit, OnDestroy {
    task!: TaskDto;
    subTasks!: TaskDto[];

    @Output() showTaskAdd = new EventEmitter<Event>();

    projects!: ProjectDto[];
    projectsMap!: Map<string, ProjectDto>;
    
    private fb = inject(FormBuilder);
    taskForm!: FormGroup;

    showTaskAddOverlay$ = new Subject<Event>();

    subtasksCount!: number;
    subtasksCompletedCount!: number;

    isRecurring = false;
    recurringOptions!: any[];

    dataUpdatedSubscription?: Subscription;

    constructor(
        private dynamicDialogConfig: DynamicDialogConfig,
        private taskService: TaskService,
        private messageService: MessageService,
        private dynamicDialogRef: DynamicDialogRef,
        private translate: TranslocoService,
        private projectService: ProjectService,
        private dataUpdatedService: DataUpdatedService,
    ) {

    }

    async ngOnInit() {
        this.task = this.dynamicDialogConfig.data.task;
        
        console.log("Recorrência da tarefa: ", this.task.recurring);
        this.taskForm = this.fb.group({
            title: [this.task.title, Validators.required],
            description: [this.task.description],
            dueDate: [this.task.dueDate],
            dueTime: [this.task.dueTime],
            // project: [this.task.project_uuid != null ? this.task.project_uuid : ''],
            project_uuid: [this.task.project_uuid != null ? this.task.project_uuid : ''],
            // parent: [this.task.parent_uuid || ''],
            parent_uuid: [this.task.parent_uuid || ''],
            recurring: [this.task.recurring || '0']
        });
        
        this.dynamicDialogConfig.data.saveSubject$.subscribe(() => {
            this.saveTask();
        });

        this.projectService.list().then(allProjects => {
            const projects = allProjects as ProjectDto[];
            const cloneProjects = projects.slice();
            const projectsMap = new Map<string, ProjectDto>();

            if (cloneProjects[0] && cloneProjects[0].uuid != '0') {
                cloneProjects.unshift({
                    uuid: '0',
                    name: "Inbox"
                } as ProjectDto);
            }
            this.projects = cloneProjects as ProjectDto[];

            projects.forEach(project => {
                projectsMap.set(project.uuid, project);
            });
            this.projectsMap = projectsMap;
        });

        this.getSubtaskList();

        this.dataUpdatedSubscription = this.dataUpdatedService.subscribe('task', () => {
            console.log("Mexeu no task, atualizando subtasks")
            this.getSubtaskList();
        });

        const notRecurringLabel = await firstValueFrom(this.translate.selectTranslate('Not recurring'));
        this.recurringOptions = [
            notRecurringLabel,
            RecurringType.DAILY,
            RecurringType.WEEKLY,
            RecurringType.WEEKDAY,
            RecurringType.MONTHLY,
            RecurringType.YEARLY
        ];
    }

    getSubtaskList() {
        this.taskService.getTaskSubtasks(this.task).subscribe(subtasks => {
            this.subTasks = subtasks;
        });

        this.taskService.countSubtasksByCompletion(this.task).subscribe(countSubtasks => {
            this.subtasksCount = countSubtasks.subtasks;
            this.subtasksCompletedCount = countSubtasks.completed;
        });
    }

    async saveTask() {
        const form = this.taskForm.value;

        const dueDate:Date | null | undefined = form.dueDate;
        let recurring = form.recurring;
        // checks if the value is not a "not recurring" option
        if (!Object.values(RecurringType).includes(recurring as unknown as RecurringType)) {
            recurring = null;
        }
        // validates recurring and date
        if (recurring && !dueDate) {
            this.messageService.add({
                severity: 'error',
                summary: await firstValueFrom(this.translate.selectTranslate('Unable to save')),
                detail: await firstValueFrom(this.translate.selectTranslate("Can't save a recurring task without a due date!")),
                key: 'task'
            });
            return;
        }

        const saveData: TaskDto = {
            id: this.task.id,
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: form.dueDate || null,
            dueTime: form.dueTime || null,
            project: 0,
            completed: 0,
            order: this.task.order,
            parent: this.task.parent,
            recurring: recurring || null,
            uuid: this.task.uuid,
            user_uuid: this.task.user_uuid,
            project_uuid: form.project_uuid || '',
            parent_uuid: this.task.parent_uuid
        };

        this.taskService.edit(this.task.uuid, saveData).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate(`Saved successfully`)),
                    detail: await firstValueFrom(this.translate.selectTranslate(`The task was saved successfully`)),
                    severity: "success",
                    key: 'task'
                });
                this.dynamicDialogRef.close(saveData);
                // triggers a chain of events until it reaches Inbox class
                this.dynamicDialogConfig.data.onSaveEditTask$.next();
            },
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate(`Error`)),
                    detail: await firstValueFrom(this.translate.selectTranslate(`Couldn't save the task.`)) + err,
                    severity: "error",
                    key: 'task'
                });
            }
        });
    }

    onSubtaskEdited(_event: Event) {
        this.dynamicDialogConfig.data.onSaveEditTask$.next();
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
        const title = this.translate.translate("Subtasks");
        return title + ` (${this.subtasksCompletedCount}/${this.subtasksCount})`;
    }

    onTitleChange(event: any) {
        const doc = nlp<DatesMethods>(event);
        let dates;
        if ((dates = doc.dates().get())) {
            const dateView = dates[0] as {start:string};
            if (dateView?.start) {
                const date = new Date(dateView.start);
                this.taskForm.patchValue({
                    dueDate: date
                });

                if (date.getHours() != 0) {
                    this.taskForm.patchValue({
                        dueTime: date
                    })
                }
            }
        }
    }

    onActivateField(event: any) {
        const parent = event.target.parentNode.parentNode;
        setTimeout(() => {
            parent.querySelector("input, textarea").focus();
        }, 500);

    }

    onTitleEnter(event: any) {
        event.preventDefault();
        this.saveTask();
    }

    ngOnDestroy(): void {
        if (this.dataUpdatedSubscription) {
            this.dataUpdatedSubscription.unsubscribe();
        }
    }
}
