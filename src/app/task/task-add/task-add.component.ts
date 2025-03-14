import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom, Subject } from 'rxjs';
import { v4 } from 'uuid';

import { AuthService } from '../../auth/auth.service';
import { ChangeDateTimeFromTextDirective } from '../../directives/change-date-time-from-text.directive';
import { ProjectDto } from '../../dto/project-dto';
import { RecurringType, TaskAddDto, TaskDto } from '../../dto/task-dto';
import { UserBound } from "../../dto/user-bound";
import { ProjectService } from '../../project/project.service';
import { TaskService } from '../task.service';
import { encodeFileToBase64 } from '../../utils/file-utils';
import { TaskAttachmentService } from '../../services/task-attachment.service';
import { FilePickerService } from '../../services/file-picker.service';
import { TaskAttachmentAddDto } from '../../dto/task-attachment-dto';

const randomUUID = v4;


@Component({
    selector: 'app-task-add',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        PopoverModule,
        CardModule,
        DatePickerModule,
        TextareaModule,
        DividerModule,
        ToastModule,
        TranslocoModule,
        SelectModule,
        CheckboxModule,
        ButtonModule,
        InputTextModule,
        DrawerModule,
        ChangeDateTimeFromTextDirective,
    ],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input()  showOverlay$!: Subject<Event>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();

    project = input<ProjectDto>();
    @Input() parent!: TaskDto;
    @Input() prefilledTitle!: string;

    @Output() taskAddedEvent = new EventEmitter<any>;
    @ViewChild('taskAddOp') taskAddOp!: Popover;

    private fb = inject(FormBuilder);
    taskForm = this.fb.group({
        title: [this.prefilledTitle ||null, Validators.required],
        description: [null],
        dueDate: [null] as [null | Date],
        dueTime: [null] as [null | Date],
        //project: [this.project?.id || null],
        project_uuid: [this.project()?.uuid || ''],
        // parent: [this.parent || null],
        parent_uuid: [this.parent || null],
        recurring: [null]
    });

    projects!: ProjectDto[];

    isRecurring = false;
    recurringOptions!: any[];
    // authService: any;

    currentLanguage = this.translate.getActiveLang();

    attachments: { name: string; blob: string }[] = [];

    constructor(
        private taskAddService: TaskService,
        private messageService: MessageService,
        private router: Router,
        private translate: TranslocoService,
        private projectService: ProjectService,
        private authService: AuthService,
        private filePickerService: FilePickerService,
        private taskAttachmentService: TaskAttachmentService
    ) { }

    ngOnInit() {
        // subscribes to the parent Subject to exhibit the overlay component
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        });

        this.projectService.list().then(projects => {
            // if (!projects.length) return;
            const cloneProjects = projects.slice() as ProjectDto[];

            if (!cloneProjects.length || cloneProjects[0].uuid != '') {
                cloneProjects.unshift({
                    uuid: '',
                    name: this.translate.translate("Inbox")
                } as ProjectDto);
            }
            this.projects = cloneProjects;
        });

        if (this.project()) {
            this.taskForm.patchValue({project_uuid: this.project()?.uuid});
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
                summary: this.translate.translate('Unable to save'),
                detail: this.translate.translate("Can't save a recurring task without a due date!"),
                key: 'task'
            });
            return;
        }

        const order = await this.taskAddService.count();
        
        const saveData: TaskAddDto = {
            title: form.title as unknown as string,
            description: form.description || null,
            dueDate: dueDate || null,
            originalDueDate: dueDate || null,
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
                    summary: this.translate.translate(`Saved successfully`),
                    detail: this.translate.translate(`The task was saved successfully`),
                    severity: "success",
                    key: 'task'
                });
                this.taskAddOp.hide();
                this.taskAddedEvent.emit();
                this.clearForm();
            },
            error: async (err: Error) => {
                this.messageService.add({
                    summary: this.translate.translate(`Error`),
                    detail: this.translate.translate(`Couldn't save the task.`) + err,
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
            project_uuid: this.parent?.project_uuid || this.project()?.uuid || '',
            // parent: this.parent || null,
            parent_uuid: this.parent || '',
            recurring: this.recurringOptions[0]
        });
        return true;
    }

    async addAttachment() {
        const base64Data = await this.filePickerService.pickFile();
        if (base64Data) {
            const attachment = {
                uuid: randomUUID(),
                name: 'Attachment', // You can customize this based on your needs
                blob: base64Data,
            };
            this.attachments.push(attachment);
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'No File Selected',
                detail: 'Please select a file to attach.',
            });
        }
    }

    removeAttachment(index: number) {
        this.attachments.splice(index, 1);
    }
}
