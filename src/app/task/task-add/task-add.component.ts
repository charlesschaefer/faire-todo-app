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
        dueDate: [null],
        dueTime: [null],
        project: [this.project?.id || null],
        parent: [this.parent || null],
        recurring: [null]
    });

    projects!: ProjectDto[];

    isRecurring = false;
    recurringOptions = [
        RecurringType.DAILY,
        RecurringType.WEEKLY,
        RecurringType.WEEKDAY,
        RecurringType.MONTHLY,
        RecurringType.YEARLY
    ];

    constructor(
        private taskAddService: TaskService<TaskAddDto>,
        private messageService: MessageService,
        private router: Router,
        private translate: TranslateService,
        private projectService: ProjectService<ProjectDto>,
    ) {}

    ngOnInit(): void {
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
    }

    onClose(event: Event) {
        this.showOverlay$.next(event);
        this.showOverlay$Change.emit(this.showOverlay$);
    }

    async saveTask() {
        const form = this.taskForm.value;
        console.log(form);
        let dueDate:Date | null | undefined = form.dueDate;
        if (this.router.url == '/today') {
            dueDate = new Date();
            dueDate.setHours(0);
            dueDate.setMinutes(0);
            dueDate.setSeconds(0);
            dueDate.setMilliseconds(0);
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
            recurring: form.recurring || null
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
            recurring: null
        });
        return true;
    }
}
