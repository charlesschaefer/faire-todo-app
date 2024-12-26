import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, Subject } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';

import { v4 } from 'uuid';

let randomUUID: any;
// if (!crypto.randomUUID) {
    randomUUID = v4;
// } else {
//     randomUUID = crypto.randomUUID;
// }

import nlp from 'compromise';
import dates, { DatesMethods } from 'compromise-dates';

nlp.plugin(dates);


import { TaskService } from '../task.service';
import { RecurringType, TaskAddDto, TaskDto } from '../../dto/task-dto';
import { Router } from '@angular/router';
import { ProjectService } from '../../project/project.service';
import { ProjectDto } from '../../dto/project-dto';
import { CheckboxModule } from 'primeng/checkbox';
import { UserBound } from '../../services/service.abstract';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-task-add',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        OverlayPanelModule,
        CardModule,
        CalendarModule,
        TextareaModule,
        DividerModule,
        ToastModule,
        TranslocoModule,
        DropdownModule,
        CheckboxModule,
        ButtonModule
    ],
    providers: [],
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input()  showOverlay$!: Subject<Event>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();


    @Input() project!: ProjectDto;
    @Input() parent!: TaskDto;
    @Input() prefilledTitle!: string;

    @Output() onAddTask = new EventEmitter<any>;
    @ViewChild('taskAddOp') taskAddOp!: OverlayPanel;

    private fb = inject(FormBuilder);
    taskForm = this.fb.group({
        title: [this.prefilledTitle ||null, Validators.required],
        description: [null],
        dueDate: [null] as [null | Date],
        dueTime: [null] as [null | Date],
        //project: [this.project?.id || null],
        project_uuid: [this.project?.uuid || null],
        // parent: [this.parent || null],
        parent_uuid: [this.parent || null],
        recurring: [null]
    });

    projects!: ProjectDto[];

    isRecurring = false;
    recurringOptions!: any[];
    // authService: any;

    constructor(
        private taskAddService: TaskService,
        private messageService: MessageService,
        private router: Router,
        private translate: TranslocoService,
        private projectService: ProjectService,
        private authService: AuthService,
    ) {}

    ngOnInit() {
        // subscribes to the parent Subject to exhibit the overlay component
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        });

        this.projectService.list().then(projects => {
            if (!projects.length) return;
            const cloneProjects = projects.slice() as ProjectDto[];

            if (cloneProjects[0].uuid != '0') {
                cloneProjects.unshift({
                    uuid: '0',
                    name: "Inbox"
                } as ProjectDto);
            }
            this.projects = cloneProjects;
        });

        if (this.project) {
            this.taskForm.patchValue({project_uuid: this.project.uuid});
        }

        let notRecurringLabel;
        firstValueFrom(this.translate.selectTranslate('Not recurring')).then(label => {
            notRecurringLabel = label;
            this.recurringOptions = [
                notRecurringLabel,
                RecurringType.DAILY,
                RecurringType.WEEKLY,
                RecurringType.WEEKDAY,
                RecurringType.MONTHLY,
                RecurringType.YEARLY
            ];
            this.taskForm.patchValue({ recurring: notRecurringLabel });
        });

        if (this.prefilledTitle) {
            this.taskForm.patchValue({ title: this.prefilledTitle });
        }
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
                summary: await firstValueFrom(this.translate.selectTranslate('Unable to save')),
                detail: await firstValueFrom(this.translate.selectTranslate("Can't save a recurring task without a due date!")),
                key: 'task'
            });
            return;
        }

        const order = await this.taskAddService.count();
        
        const saveData: TaskAddDto = {
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: dueDate || null,
            dueTime: form.dueTime || null,
            project: this.parent?.project || 0,
            project_uuid: this.parent?.project_uuid || form.project_uuid || '',
            completed: 0,
            order: order,
            parent: this.parent?.id || null,
            parent_uuid: this.parent?.uuid || '',
            recurring: recurring || null,
            uuid: randomUUID(),
            user_uuid: this.authService.currentUser?.id as string
        };

        this.taskAddService.add(saveData as TaskAddDto & UserBound).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate(`Saved successfully`)),
                    detail: await firstValueFrom(this.translate.selectTranslate(`The task was saved successfully`)),
                    severity: "success",
                    key: 'task'
                });
                this.taskAddOp.hide();
                this.onAddTask.emit();
                this.clearForm();
            },
            error: async (err: Error) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate(`Error`)),
                    detail: await firstValueFrom(this.translate.selectTranslate(`Couldn't save the task.`)) + err,
                    severity: "error",
                    key: 'task'
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
            //project: this.parent?.project || this.project?.id,
            project_uuid: this.parent?.project_uuid || this.project?.uuid || '',
            // parent: this.parent || null,
            parent_uuid: this.parent || '',
            recurring: this.recurringOptions[0]
        });
        return true;
    }

    onTitleChange(event: any) {
        const doc = nlp<DatesMethods>(event);
        let dates;
        if (dates = doc.dates().get()) {
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
}
