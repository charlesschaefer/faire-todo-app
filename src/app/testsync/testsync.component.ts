import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { v4 } from 'uuid';

let randomUUID: any;
if (!crypto.randomUUID) {
    randomUUID = v4;
} else {
    randomUUID = crypto.randomUUID;
}

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
        TranslocoModule,
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
        uuid: ['', Validators.required],
        name: ['', Validators.required],
        created: [new Date()],
        description: [''],
        enabled: [1]
    });

    editTestSyncVisible = false;
    
    testSyncMenuItems!: MenuItem[];

    constructor(
        private testSyncService: TestSyncService,
        private testSyncAddService: TestSyncService,
        private translate: TranslocoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private taskService: TaskService,
        protected router: Router,
    ) { }

    ngOnInit() {
        this.getTestSyncs();
    }

    getTestSyncs() {
        this.testSyncService.list().subscribe(testSyncs => this.testSyncs = testSyncs);
    }

    async confirmDeleteTestSync(uuid: string) {
        this.confirmationService.confirm({
            header: await firstValueFrom(this.translate.selectTranslate(`Are you sure?`)),
            message: await firstValueFrom(this.translate.selectTranslate(`Are you sure you want to delete this testSync? All of it's tasks will be removed too!`)),
            icon: "pi pi-exclamation-triangle",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteTestSync(uuid);
            }
        });
    }

    deleteTestSync(uuid: string) {
        // deletes the testSync
        this.testSyncService.remove(uuid).subscribe({
            complete: () => {
                this.taskService.getByField('testSync', uuid).subscribe(tasks => {
                    const tasksIds: string[] = [];
                    tasks.forEach(task => tasksIds.push(task.uuid));
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

    editTestSyncDialog(uuid: string) {
        const testSync = this.testSyncs.filter(testSync => testSync.uuid == uuid)[0];
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
        this.testSyncService.edit(form.uuid as string, formData).subscribe({
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
            uuid: randomUUID(),
            user_uuid: '',
            created: form.created as Date,
            description: form.description as string,
            enabled: form.enabled as number
        };

        this.testSyncAddService.add(testSyncData as TestSyncDto & UserBound).subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate("Saved successfully")),
                    detail: await firstValueFrom(this.translate.selectTranslate("TestSync saved successfully")),
                    severity: 'success'
                });
                setTimeout(() => window.location.reload(), 2000);
            },
            error: async (err: Error) => this.messageService.add({
                summary: await firstValueFrom(this.translate.selectTranslate("Error")),
                detail: await firstValueFrom(this.translate.selectTranslate("Couldn't save the TestSync.")) + err,
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

    buildUrl(uuid: string) {
        return `/testSync/${uuid}/tasks`;
    }
}
