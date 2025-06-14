import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, HostListener, OnDestroy, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DateTime } from 'luxon';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { firstValueFrom, from, map, mergeMap, Subject, Subscription } from 'rxjs';

import { ProjectDto } from '../dto/project-dto';
import { TaskDto } from '../dto/task-dto';
import { SubtitlePipe } from '../pipes/subtitle.pipe';
import { DataUpdatedService } from '../db/data-updated.service';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskListComponent } from "../task/task-list/task-list.component";
import { TaskService } from '../task/task.service';


@Component({
    selector: 'app-inbox',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        RadioButtonModule,
        FormsModule,
        ReactiveFormsModule,
        OverlayPanelModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputTextModule,
        ChipModule,
        CardModule,
        TextareaModule,
        DividerModule,
        CalendarModule,
        TaskListComponent,
        TaskAddComponent,
        TranslocoModule,
        ButtonModule,
        SubtitlePipe,
        PanelModule,
        BadgeModule,
        OverlayBadgeModule,
    ],
    templateUrl: './inbox.component.html',
    styleUrl: './inbox.component.scss'
})
export class InboxComponent implements OnInit, AfterViewInit, OnDestroy {
    pageTitle = 'Inbox';
    pageSubtitle = '';
    subtitleModifier = '';

    tasks = signal<TaskDto[]>([]);
    subtasksCount!: Map<string, number>;
    attachmentsCount!: Map<string, number>;

    showTaskAddOverlay$ = new Subject<Event>();

    // The url received from the share event. This should be used to fill the title of a new task.
    sharetargetUrl!: string;

    isAddTaskOpen = false;
    isEditTaskOpen = false;
    @ViewChild('appTaskList') appTaskList?: TaskListComponent;

    taskSubscription?: Subscription;

    hasDueTask = computed(() => this.dueTasks().length > 0);
    dueTasks = signal<TaskDto[]>([]);

    project?: WritableSignal<ProjectDto | undefined>;

    constructor(
        protected taskService: TaskService,
        protected activatedRoute: ActivatedRoute,
        protected dataUpdatedService: DataUpdatedService,
    ) { }

    /**
     * This method is called after the view has been initialized.
     * It is used to show the task add overlay if the sharetargetUrl is present.
     */
    ngAfterViewInit() {
        if (this.sharetargetUrl) {
            const event = {
                ...(new CustomEvent('click') as object),
                target: document.querySelector('.task-add-line'),
            } as Event;
            this.onShowTaskAddOverlay(event);
        }
    }

    ngOnInit() {
        this.getTasks();

        void (!this.taskSubscription ? this.taskSubscription = this.dataUpdatedService?.subscribe('task', (_changes) => {
            console.log("Mexeu no task, atualizando inbox")
            this.getTasks();
        }) : null);

        this.showTaskAddOverlay$.subscribe(() => {
            this.isAddTaskOpen = true;
            this.isEditTaskOpen = false;
        });

    }

    ngOnDestroy(): void {
        this.taskSubscription?.unsubscribe();
    }

    onShowTaskAddOverlay(event: Event) {
        this.showTaskAddOverlay$.next(event);
    }

    async getTasks() {
        const tasks = await firstValueFrom(this.taskService.getProjectTasks('').pipe(
            mergeMap((tasks) => {
                tasks = this.taskService.orderTasks(tasks as TaskDto[]);
                return from(this.taskService.countAllTasksSubtasks(tasks as TaskDto[])).pipe(
                    map(subtasksCount => {
                        return {
                            tasks: tasks,
                            subtasksCount: subtasksCount
                        };
                    })
                );
            })
        ));
        this.tasks.set(tasks.tasks);
        this.subtasksCount = tasks.subtasksCount;

        // Count attachments for tasks
        this.taskService.countAttachmentsForTasks(this.tasks()).subscribe((counts) => {
            this.attachmentsCount = counts;
        });

        this.separateDueTasks();

    }

    separateDueTasks() {
        const { dueTasks, otherTasks } = { ...this.taskService.separateDueTasks(this.tasks()) };
        this.tasks.set(otherTasks);
        if (dueTasks.length) {
            dueTasks.sort((a, b) => {
                if (!a.dueDate || !b.dueDate) {
                    return 1;
                }
                // if none have time, sort by date
                if (!b.dueTime && !a.dueTime) {
                    if (a.dueDate <= b.dueDate) {
                        return 1;
                    }
                    return -1;
                }

                // bellow we use the end time of the day only when
                // the task has date but not time.
                const aTime = DateTime.fromJSDate(a.dueDate).plus({
                    hour: a.dueTime?.getHours() ?? 23,
                    minute: a.dueTime?.getMinutes() ?? 59
                });
                const bTime = DateTime.fromJSDate(b.dueDate).plus({
                    hour: b.dueTime?.getHours() ?? 23,
                    minute: b.dueTime?.getMinutes() ?? 59
                });

                if (aTime < bTime) return 1;
                return -1;
            });
            this.dueTasks.set(dueTasks);
        } else {
            this.dueTasks.set([]);
        }
    }
    rescheduleDueTasksForToday(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.dueTasks) {
            this.taskService.rescheduleTasksForToday(this.dueTasks());
        }
    }
    async countSubtasks() {
        if (this.tasks()) {
            this.subtasksCount = await this.taskService.countAllTasksSubtasks(this.tasks());
        }
    }

    onAddTask() {
        this.getTasks();

        this.sharetargetUrl = '';
        this.isAddTaskOpen = false;
        this.isEditTaskOpen = false;
    }

    onEditTask() {
        console.log("called Inbox.onEditTask()");
        this.getTasks();

        this.isAddTaskOpen = false;
        this.isEditTaskOpen = false;
    }

    onShowOverlayChange(_event: any) {
        this.sharetargetUrl = '';

        this.isAddTaskOpen = false;
        this.isEditTaskOpen = false;
    }

    @HostListener('document:keydown.shift.n', ['$event'])
    shortcutNewTask(_event: KeyboardEvent) {
        const active = document.activeElement;
        // won't activate if the focused element is not the body
        if (!(active instanceof HTMLBodyElement)) {
            return;
        }

        if (this.isAddTaskOpen || this.isEditTaskOpen) {
            return;
        }

        const clickEvent = new MouseEvent('click')
        const target = document.querySelector(".task-add-button");
        target?.dispatchEvent(clickEvent);

        this.onShowTaskAddOverlay(clickEvent);

    }
}
