import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DatabaseChangeType } from 'dexie-observable/api';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { v4 } from 'uuid';

import { ProjectAddDto, ProjectDto } from '../dto/project-dto';
import { TaskDto } from '../dto/task-dto';
import { Changes, DataUpdatedService } from '../services/data-updated.service';
import { TaskService } from '../task/task.service';
import { ProjectService } from './project.service';

const randomUUID: any = v4;

@Component({
    selector: 'app-project',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        PanelModule,
        CardModule,
        MenuModule,
        ButtonModule,
        OverlayPanelModule,
        CardModule,
        InputTextModule,
        DividerModule,
        TranslocoModule,
        ConfirmDialogModule,
        DialogModule,
        ToastModule,
    ],
    providers: [
        ConfirmationService
    ],
    templateUrl: './project.component.html',
    styleUrl: './project.component.scss'
})
export class ProjectComponent implements OnInit, OnDestroy {
    @ViewChild('projectAddOp') projectAddOp!: OverlayPanel;
    
    projects: ProjectDto[] = [];
    fb = inject(FormBuilder);
    projectForm = this.fb.group({
        name: [null, Validators.required],
    });

    projectEditForm = this.fb.group({
        uuid: ['', Validators.required],
        name: ['', Validators.required]
    });

    editProjectVisible = false;
    
    projectMenuItems!: MenuItem[];

    projectSubscription?: Subscription;

    constructor(
        private projectService: ProjectService,
        private projectAddService: ProjectService,
        private translate: TranslocoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private taskService: TaskService,
        protected router: Router,
        protected dataUpdatedService: DataUpdatedService,
    ) { }

    ngOnInit() {
        this.getProjects();
        this.projectSubscription = this.dataUpdatedService.subscribe('project', (_changes) => this.getProjects());
    }

    ngOnDestroy(): void {
        this.projectSubscription?.unsubscribe();
    }

    getProjects() {
        this.projectService.list().then(projects => this.projects = projects as ProjectDto[]);
    }

    async confirmDeleteProject(uuid: string) {
        this.confirmationService.confirm({
            header: this.translate.translate(`Are you sure?`),
            message: this.translate.translate(`Are you sure you want to delete this project? All of it's tasks will be removed too!`),
            icon: "pi pi-exclamation-triangle",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteProject(uuid);
            }
        });
    }

    deleteProject(uuid: string) {
        // deletes the project
        this.projectService.remove(uuid).subscribe({
            complete: () => {
                this.taskService.getByField('project_uuid', uuid).then(tasks => {
                    const tasksIds: string[] = [];
                    (tasks as TaskDto[]).forEach((task: TaskDto) => tasksIds.push(task.uuid));
                    // then deletes the tasks of the project
                    this.taskService.bulkRemove(tasksIds);
                    this.messageService.add({
                        summary: "Removed",
                        detail: "Project and it's tasks removed successfully!",
                        severity: "success",
                        key: 'task'
                    });
                    // setTimeout(() => window.location.reload(), 2000);
                });
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error trying to delete the project and it's tasks" + err,
                severity: 'error',
                key: 'task'
            })
        });
    }

    editProjectDialog(uuid: string) {
        const project = this.projects.filter(project => project.uuid == uuid)[0];
        this.projectEditForm.patchValue({
            name: project.name as unknown as string,
            uuid: project.uuid as unknown as string
        });
        this.editProjectVisible = true;
    }

    editProject() {
        const form = this.projectEditForm.value;
        const formData = {
            uuid: form.uuid as string,
            name: form.name as string,
        } as ProjectDto;
        this.projectService.edit(form.uuid as string, formData).subscribe({
            complete: () => {
                this.editProjectVisible = false;
                // setTimeout(() => window.location.reload(), 2000);
                this.dataUpdatedService.next([{
                    key: 'uuid',
                    type: DatabaseChangeType.Update,
                    table: 'project',
                    mods: formData,
                    obj: formData,
                    oldObj: formData
                } as Changes]);
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error editing project." + err,
                severity: "error",
                key: 'task'
            })
        });
    }

    showProjectAddPanel(event: Event) {
        this.projectAddOp.show(event);
    }

    saveProject() {
        const form = this.projectForm.value;
        const projectData: ProjectAddDto = {
            name: form.name as unknown as string,
            uuid: randomUUID(),
            user_uuid: ''
        };

        this.projectAddService.add(projectData).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: this.translate.translate("Saved successfully"),
                    detail: this.translate.translate("Project saved successfully"),
                    severity: 'success',
                    key: 'task'
                });
                //setTimeout(() => window.location.reload(), 2000);
            },
            error: async (err: Error) => this.messageService.add({
                summary: this.translate.translate("Error"),
                detail: this.translate.translate("Couldn't save the Project.") + err,
                severity: 'error',
                key: 'task'
            }),
        });

        this.clearForm();
        this.projectAddOp.hide();
        this.getProjects();
    }

    clearForm() {
        this.projectForm.patchValue({
            name: null
        });
        return true;
    }

    buildUrl(id: number|string) {
        return `/project/${id}/tasks`;
    }
}
