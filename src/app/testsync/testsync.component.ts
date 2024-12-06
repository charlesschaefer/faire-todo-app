import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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

import { ProjectService } from '../services/project.service';
import { ProjectAddDto, ProjectDto } from '../dto/project-dto';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { TaskService } from '../services/task.service';
import { TaskDto } from '../dto/task-dto';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TestSyncService } from './services/testsync.service';
import { TestSyncAddDto, TestSyncDto } from './dto/testsync.dto';
import { UserBound } from '../services/service.abstract';


@Component({
    selector: 'app-testsync',
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
        TranslateModule,
        ConfirmDialogModule,
        DialogModule,
        ToastModule,
    ],
    templateUrl: './testsync.component.html',
    styleUrl: './testsync.component.scss'
})
export class TestSyncComponent implements OnInit {
    @ViewChild('testSyncAddOp') testSyncAddOp!: OverlayPanel;
    
    testSyncs: TestSyncDto[] = [];
    fb = inject(FormBuilder);
    testSyncForm = this.fb.group({
        name: [null, Validators.required],
        created: [new Date()],
        description: [''],
        enabled: [1]
    });

    testSyncEditForm = this.fb.group({
        id: [0, Validators.required],
        uuid: [null, Validators.required],
        name: ['', Validators.required],
        created: [new Date()],
        description: [''],
        enabled: [1]
    });

    editTestSyncVisible = false;
    
    testSyncMenuItems!: MenuItem[];

    constructor(
        private testSyncService: TestSyncService<TestSyncDto>,
        private testSyncAddService: TestSyncService<TestSyncAddDto>,
        private translate: TranslateService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private taskService: TaskService<TaskDto>,
        protected router: Router,
    ) { }

    ngOnInit() {
        this.getTestSyncs();
    }

    getTestSyncs() {
        this.testSyncService.list().subscribe(testSyncs => this.testSyncs = testSyncs);
    }

    async confirmDeleteTestSync(id: number) {
        this.confirmationService.confirm({
            header: await firstValueFrom(this.translate.get(`Are you sure?`)),
            message: await firstValueFrom(this.translate.get(`Are you sure you want to delete this testSync? All of it's tasks will be removed too!`)),
            icon: "pi pi-exclamation-triangle",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteTestSync(id);
            }
        });
    }

    deleteTestSync(id: number) {
        // deletes the testSync
        this.testSyncService.remove(id).subscribe({
            complete: () => {
                this.taskService.getByField('testSync', id).subscribe(tasks => {
                    let tasksIds: number[] = [];
                    tasks.forEach((task: TaskDto) => tasksIds.push(task.id));
                    // then deletes the tasks of the testSync
                    this.taskService.bulkRemove(tasksIds);
                    this.messageService.add({
                        summary: "Removed",
                        detail: "TestSync and it's tasks removed successfully!",
                        severity: "success"
                    });
                    setTimeout(() => window.location.reload(), 2000);
                });
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error trying to delete the testSync and it's tasks" + err,
                severity: 'error'
            })
        });
    }

    editTestSyncDialog(id: number) {
        const testSync = this.testSyncs.filter(testSync => testSync.id == id)[0];
        this.testSyncEditForm.patchValue({
            name: testSync.name as unknown as string,
            id: testSync.id as unknown as number
        });
        this.editTestSyncVisible = true;
    }

    editTestSync() {
        const form = this.testSyncEditForm.value;
        const formData = {
            id: form.id as number,
            name: form.name as string,
            created: form.created as Date,
            description: form.description as string,
            enabled: form.enabled as number
        } as TestSyncDto;
        this.testSyncService.edit(form.id as number, formData).subscribe({
            complete: () => {
                this.editTestSyncVisible = false;
                setTimeout(() => window.location.reload(), 2000);
            },
            error: (err) => this.messageService.add({
                summary: "Error",
                detail: "Error editing testSync." + err,
                severity: "error"
            })
        });
    }

    showTestSyncAddPanel(event: Event) {
        this.testSyncAddOp.show(event);
    }

    saveTestSync() {
        const form = this.testSyncForm.value;
        const testSyncData: TestSyncAddDto = {
            name: form.name as unknown as string,
            uuid: crypto.randomUUID(),
            user_uuid: '',
            created: form.created as Date,
            description: form.description as string,
            enabled: form.enabled as number
        };

        this.testSyncAddService.add(testSyncData as TestSyncDto & UserBound).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get("Saved successfully")),
                    detail: await firstValueFrom(this.translate.get("TestSync saved successfully")),
                    severity: 'success'
                });
                setTimeout(() => window.location.reload(), 2000);
            },
            error: async (err: Error) => this.messageService.add({
                summary: await firstValueFrom(this.translate.get("Error")),
                detail: await firstValueFrom(this.translate.get("Couldn't save the TestSync.")) + err,
                severity: 'error'
            }),
        });

        this.clearForm();
        this.testSyncAddOp.hide();
        this.getTestSyncs();
    }

    clearForm() {
        this.testSyncForm.patchValue({
            name: null
        });
        return true;
    }

    buildUrl(id: number) {
        return `/testSync/${id}/tasks`;
    }
}
