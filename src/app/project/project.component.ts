import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

import { v4 } from 'uuid';

let randomUUID: any;
// if (!crypto.randomUUID) {
    randomUUID = v4;
// } else {
//     randomUUID = crypto.randomUUID;
//     randomUUID();
// }

import { ProjectService } from '../services/project.service';
import { ProjectAddDto, ProjectDto } from '../dto/project-dto';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { TaskService } from '../services/task.service';
import { TaskAddDto, TaskDto } from '../dto/task-dto';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';

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
        MessageService,
        ConfirmationService
    ],
    templateUrl: './project.component.html',
    styleUrl: './project.component.scss'
})
export class ProjectComponent implements OnInit {
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

    constructor(
        private projectService: ProjectService,
        private projectAddService: ProjectService,
        private translate: TranslocoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private taskService: TaskService,
        protected router: Router,
    ) { }

    ngOnInit() {
        this.getProjects();
    }

    getProjects() {
        this.projectService.list().subscribe(projects => this.projects = projects);
    }

    async confirmDeleteProject(uuid: string) {
        this.confirmationService.confirm({
            header: await firstValueFrom(this.translate.selectTranslate(`Are you sure?`)),
            message: await firstValueFrom(this.translate.selectTranslate(`Are you sure you want to delete this project? All of it's tasks will be removed too!`)),
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
                this.taskService.getByField('project_uuid', uuid).subscribe(tasks => {
                    const tasksIds: string[] = [];
                    (tasks as TaskDto[]).forEach((task: TaskDto) => tasksIds.push(task.uuid));
                    // then deletes the tasks of the project
                    this.taskService.bulkRemove(tasksIds);
                    this.messageService.add({
                        summary: "Removed",
                        detail: "Project and it's tasks removed successfully!",
                        severity: "success"
                    });
                    setTimeout(() => window.location.reload(), 2000);
                });
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error trying to delete the project and it's tasks" + err,
                severity: 'error'
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
                setTimeout(() => window.location.reload(), 2000);
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error editing project." + err,
                severity: "error"
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
                    summary: await firstValueFrom(this.translate.selectTranslate("Saved successfully")),
                    detail: await firstValueFrom(this.translate.selectTranslate("Project saved successfully")),
                    severity: 'success'
                });
                setTimeout(() => window.location.reload(), 2000);
            },
            error: async (err: Error) => this.messageService.add({
                summary: await firstValueFrom(this.translate.selectTranslate("Error")),
                detail: await firstValueFrom(this.translate.selectTranslate("Couldn't save the Project.")) + err,
                severity: 'error'
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
