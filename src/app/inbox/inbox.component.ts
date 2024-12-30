import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, from, map, mergeMap, Subject, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { RadioButtonModule } from 'primeng/radiobutton';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { CalendarModule } from 'primeng/calendar';

import { TaskListComponent } from "../task/task-list/task-list.component";
import { TaskDto } from '../dto/task-dto';
import { TaskAddComponent } from '../task/task-add/task-add.component';
import { TaskService } from '../task/task.service';
import { TranslocoModule } from '@jsverse/transloco';
import { ActivatedRoute } from '@angular/router';
import { DataUpdatedService } from '../services/data-updated.service';


@Component({
    selector: 'app-inbox',
    standalone: true,
    imports: [
        DataViewModule,
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
    ],
    templateUrl: './inbox.component.html',
    styleUrl: './inbox.component.scss'
})
export class InboxComponent implements OnInit, AfterViewInit, OnDestroy {
    tasks!: TaskDto[];
    subtasksCount!: Map<string, number>;

    showTaskAddOverlay$ = new Subject<Event>();

    // The url received from the share event. This should be used to fill the title of a new task.
    sharetargetUrl!: string;

    isAddTaskOpen = false;
    isEditTaskOpen = false;
    @ViewChild('appTaskList') appTaskList?: TaskListComponent;

    taskSubscription?: Subscription;

    hasDueTask = false;
    dueTasks?: TaskDto[] = [];

    constructor(
        protected taskService: TaskService,
        protected activatedRoute: ActivatedRoute,
        protected dataUpdatedService: DataUpdatedService,
    ) {}
    
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

        !this.taskSubscription ? this.taskSubscription = this.dataUpdatedService?.subscribe('task', (changes) => {
            this.getTasks();
        }) : null;

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
        const tasks = await firstValueFrom(this.taskService.getFromProject('').pipe(
            mergeMap((tasks) => {
                tasks = this.taskService.orderTasks(tasks as TaskDto[]);
                return from(this.taskService.countTasksSubtasks(tasks as TaskDto[])).pipe(
                    map(subtasksCount => {
                        return {
                            tasks: tasks,
                            subtasksCount: subtasksCount
                        };
                    })
                );
            })
        ));
        this.tasks = tasks.tasks;
        this.subtasksCount = tasks.subtasksCount;

        console.log(this.tasks);

        this.separateDueTasks();
    }

    separateDueTasks() {
        const { dueTasks, otherTasks } = { ...this.taskService.separateDueTasks(this.tasks) };
        this.tasks = otherTasks;
        if (dueTasks.length) {
            this.hasDueTask = true;
            dueTasks.sort((a, b) => !a.dueDate || !b.dueDate || a.dueDate < b.dueDate ? 1 : 0);
            this.dueTasks = dueTasks;
        } else {
            this.dueTasks = [];
            this.hasDueTask = false;
        }
    }
    rescheduleDueTasksForToday(event: any) {
        if (this.dueTasks) {
            this.taskService.rescheduleTasksForToday(this.dueTasks);
        }
    }

    async countSubtasks() {
        if (this.tasks) {
            this.subtasksCount = await this.taskService.countTasksSubtasks(this.tasks);
        }
    }

    onAddTask() {
        this.getTasks();

        this.sharetargetUrl = '';
        this.isAddTaskOpen  = false;
        this.isEditTaskOpen = false;
    }
    
    onEditTask() {
        console.log("called Inbox.onEditTask()");
        this.getTasks();

        this.isAddTaskOpen = false;
        this.isEditTaskOpen = false;
    }

    onShowOverlayChange(event: any) {
        this.sharetargetUrl = '';

        this.isAddTaskOpen = false;
        this.isEditTaskOpen = false;
    }

    @HostListener('document:keydown.shift.n', ['$event'])
    shortcutNewTask(event: KeyboardEvent) {
        const active = document.activeElement;
        // won't activate if the focused element is not the body
        if (!(active instanceof HTMLBodyElement)) {
            return;
        }

        if (this.isAddTaskOpen || this.isEditTaskOpen) {
            return;
        }
        console.log(this.appTaskList);

        const clickEvent = new MouseEvent('click')
        const target = document.querySelector(".task-add-button");
        target?.dispatchEvent(clickEvent);

        this.onShowTaskAddOverlay(clickEvent);

        console.log("Entrou", document.activeElement)
    }
}
