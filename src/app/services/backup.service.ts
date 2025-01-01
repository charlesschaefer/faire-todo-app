import { AES, enc } from 'crypto-js';

import { Injectable } from '@angular/core';
import { TaskService } from '../task/task.service';
import { ProjectService } from '../project/project.service';
import { SettingsService } from '../settings/settings.service';
import { TagService } from './tag.service';
import { TaskTagService } from './task-tag.service';
import { TaskDto } from '../dto/task-dto';
import { ProjectDto } from '../dto/project-dto';
import { SettingsDto } from '../dto/settings-dto';
import { TagDto } from '../dto/tag-dto';
import { TaskTagDto } from '../dto/task-tag-dto';
import { forkJoin, Subject } from 'rxjs';

interface BackupData {
    task: TaskDto[];
    project: ProjectDto[];
    settings: SettingsDto[];
    tag: TagDto[];
    taskTag: TaskTagDto[];
}

@Injectable({
    providedIn: 'root'
})
export class BackupService {
    
    constructor(
        private taskService: TaskService,
        private projectService: ProjectService,
        private settingsService: SettingsService,
        private tagService: TagService,
        private taskTagService: TaskTagService,
    ) { }
    
    backupData(encryptKey: string): Subject<string> {
        let backupObj: BackupData;
        const backupSubject$ = new Subject<string>();

        this.taskService.list().then(task => {
            this.projectService.list().then(project => {
                this.settingsService.list().then(settings => {
                    this.tagService.list().then(tag => {
                        this.taskTagService.list().then(taskTag => {
                            backupObj = {
                                task, project, settings, tag, taskTag
                            } as BackupData;
                             const jsonBackup = JSON.stringify(backupObj);
                             const encryptedBackup = AES.encrypt(jsonBackup, encryptKey);
                             backupSubject$.next(encryptedBackup.toString());
                        })
                    })
                })
            })
        })

        // FIXME: for some reason forkJoin isn't working so we used the list() chained above
        /*const backupData$ = forkJoin({
            task: this.taskService.list(),
            project: this.projectService.list(),
            settings: this.settingsService.list(),
            tag: this.tagService.list(),
            taskTag: this.taskTagService.list(),
        });

        console.log(backupData$);

        console.log("Subscribing backupData$");
        backupData$.subscribe({
            next: (result) => {
                console.log("Triggered next");
                backupObj = result as BackupData
            },
            complete: () => {
                console.log("Triggered complete");
                const jsonBackup = JSON.stringify(backupObj);
                const encryptedBackup = AES.encrypt(jsonBackup, encryptKey);
                backupSubject$.next(encryptedBackup.toString());
            },
            error: (err) => {
                console.log("Error: ", err);
            },
        });*/

        return backupSubject$;
    }

    restoreBackup(encryptedData: string, decryptKey: string) {
        let jsonBackup;
        const backupResponse$ = new Subject();
        console.log("Encrypted data: ", encryptedData, "decryptKey", decryptKey);
        try {
            // alert("Data received: " + encryptedData + " Total bytes: " + encryptedData.length);
            const decryptedBackup = AES.decrypt(encryptedData, decryptKey);
            // alert("Backup decriptado: " + decryptedBackup.toString(enc.Utf8) + " Total bytes: " + decryptedBackup.toString(enc.Utf8).length);
            console.log("Received the data and here it is after decrypting: ");
            console.log(decryptedBackup.toString(enc.Utf8));
            console.log("Total bytes: ", decryptedBackup.toString(enc.Utf8).length);
            jsonBackup = JSON.parse(decryptedBackup.toString(enc.Utf8)) as BackupData;
        } catch (error) {
            console.log("Error trying to decrypt or convert json: ", error);
            // const decryptedBackup = AES.decrypt(encryptedData, decryptKey);
            // alert(decryptedBackup.toString(enc.Utf8));
            backupResponse$.error(error);
            return backupResponse$;
        }
        jsonBackup = this.rehydrateDateFields(jsonBackup);
        console.log("Resultado: ", jsonBackup);

        // everything ok, lets restore the backup
        this.taskService.clear();
        this.projectService.clear();
        this.settingsService.clear();
        this.tagService.clear();
        this.taskTagService.clear();

        const savedData$ = forkJoin({
            task: this.taskService.bulkAdd(jsonBackup.task),
            project: this.projectService.bulkAdd(jsonBackup.project),
            settings: this.settingsService.bulkAdd(jsonBackup.settings),
            tag: this.tagService.bulkAdd(jsonBackup.tag),
            taskTag: this.taskTagService.bulkAdd(jsonBackup.taskTag)
        });

        savedData$.subscribe({
            next: (result) => {
                console.log("Emitindo o próximo", result);
            },
            complete: () =>  {
                console.log("Finished restauring the backup");
                backupResponse$.complete();
            },
            error: (err) => {
                console.log("Couldn't save the backup: ", err);
                backupResponse$.error(err);
            }
        });

        return backupResponse$;

    }

    rehydrateDateFields(jsonBackup: BackupData): BackupData {
        jsonBackup.task.forEach((value, index) => {
            if (value.dueDate) {
                jsonBackup.task[index].dueDate = new Date(value.dueDate as unknown as string);
                if (jsonBackup.task[index].dueDate?.getFullYear() == 1969) {
                    jsonBackup.task[index].dueDate = null;
                }
            }
        });

        return jsonBackup;
    }
}
