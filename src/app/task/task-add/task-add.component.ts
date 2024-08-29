import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';

import nlp from 'compromise';
import dates, { DatesMethods } from 'compromise-dates';

nlp.plugin(dates);


import { TaskService } from '../../services/task.service';
import { RecurringType, TaskAddDto, TaskDto } from '../../dto/task-dto';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ProjectDto } from '../../dto/project-dto';
import { CheckboxModule } from 'primeng/checkbox';

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
        TranslateModule,
        DropdownModule,
        CheckboxModule,
    ],
    providers: [
        MessageService,
    ],
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input() showOverlay$!: Subject<Event>;
    @Input() project!: ProjectDto;
    @Input() parent!: TaskDto;

    @Output() onAddTask = new EventEmitter<any>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();
    @ViewChild('taskAddOp') taskAddOp!: OverlayPanel;

    private fb = inject(FormBuilder);
    taskForm = this.fb.group({
        title: [null, Validators.required],
        description: [null],
        dueDate: [null] as [null | Date],
        dueTime: [null] as [null | Date],
        project: [this.project?.id || null],
        parent: [this.parent || null],
        recurring: [null]
    });

    projects!: ProjectDto[];

    isRecurring = false;
    recurringOptions!: Array<any>;

    constructor(
        private taskAddService: TaskService<TaskAddDto>,
        private messageService: MessageService,
        private router: Router,
        private translate: TranslateService,
        private projectService: ProjectService<ProjectDto>,
    ) {}

    async ngOnInit() {
        // subscribes to the parent Subject to exhibit the overlay component
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        });

        this.projectService.list().subscribe(projects => {
            if (!projects.length) return;
            let cloneProjects = projects.slice();

            if (cloneProjects[0].id != 0) {
                cloneProjects.unshift({
                    id: 0,
                    name: "Inbox"
                });
            }
            this.projects = cloneProjects;
        });

        if (this.project) {
            this.taskForm.patchValue({project: this.project.id});
        }

        const notRecurringLabel = await firstValueFrom(this.translate.get('Not recurring'));
        this.recurringOptions = [
            notRecurringLabel,
            RecurringType.DAILY,
            RecurringType.WEEKLY,
            RecurringType.WEEKDAY,
            RecurringType.MONTHLY,
            RecurringType.YEARLY
        ];
        this.taskForm.patchValue({ recurring: notRecurringLabel });
    }

    onClose(event: Event) {
        this.showOverlay$.next(event);
        this.showOverlay$Change.emit(this.showOverlay$);
    }

    async saveTask() {
        const form = this.taskForm.value;
        
        let dueDate:Date | null | undefined = form.dueDate;
        if (this.router.url == '/today') {
            dueDate = new Date();
            dueDate.setHours(0);
            dueDate.setMinutes(0);
            dueDate.setSeconds(0);
            dueDate.setMilliseconds(0);
        }

        let recurring = form.recurring;
        // checks if the value is not a "not recurring" option
        if (!Object.values(RecurringType).includes(recurring as unknown as RecurringType)) {
            recurring = null;
        }
        // validates recurring and date
        if (recurring && !dueDate) {
            this.messageService.add({
                severity: 'error',
                summary: await firstValueFrom(this.translate.get('Unable to save')),
                detail: await firstValueFrom(this.translate.get("Can't save a recurring task without a due date!"))
            });
            return;
        }

        let order = await firstValueFrom(this.taskAddService.count());
        
        const saveData: TaskAddDto = {
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: dueDate || null,
            dueTime: form.dueTime || null,
            project: this.parent?.project || form.project || 0,
            completed: 0,
            order: order,
            parent: this.parent?.id || null,
            recurring: recurring || null
        };

        this.taskAddService.add(saveData).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Saved successfully`)),
                    detail: await firstValueFrom(this.translate.get(`The task was saved successfully`)),
                    severity: "success"
                });
                this.taskAddOp.hide();
                this.onAddTask.emit();
                this.clearForm();
            },
            error: async (err: Error) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get(`Error`)),
                    detail: await firstValueFrom(this.translate.get(`Couldn't save the task.`)) + err,
                    severity: "error"
                });
            }
        });
    }

    clearForm(): boolean {
        this.taskForm.patchValue({
            title: null,
            description: null,
            dueDate: null,
            dueTime: null,
            project: this.parent?.project || this.project?.id,
            parent: this.parent || null,
            recurring: this.recurringOptions[0]
        });
        return true;
    }

    onTitleChange(event: any) {
        let doc = nlp<DatesMethods>(event);
        let dates;
        if (dates = doc.dates().get()) {
            const dateView = dates[0] as {start:string};
            if (dateView?.start) {
                let date = new Date(dateView.start);
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
}
