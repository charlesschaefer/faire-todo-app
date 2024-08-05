import { AES, enc } from 'crypto-js';

import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { SettingsService } from './settings.service';
import { TagService } from './tag.service';
import { TaskTagService } from './task-tag.service';
import { TaskDto } from '../dto/task-dto';
import { ProjectDto } from '../dto/project-dto';
import { SettingsDto } from '../dto/settings-dto';
import { TagDto } from '../dto/tag-dto';
import { TaskTagDto } from '../dto/task-tag-dto';
import { forkJoin, Observable, Subject } from 'rxjs';

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
        private taskService: TaskService<TaskDto>,
        private projectService: ProjectService<ProjectDto>,
        private settingsService: SettingsService<SettingsDto>,
        private tagService: TagService<TagDto>,
        private taskTagService: TaskTagService<TaskTagDto>,
    ) { }
    
    backupData(encryptKey: string): Subject<string> {
        let backupObj: BackupData;
        let backupSubject$ = new Subject<string>();

        this.taskService.list().subscribe(task => {
            this.projectService.list().subscribe(project => {
                this.settingsService.list().subscribe(settings => {
                    this.tagService.list().subscribe(tag => {
                        this.taskTagService.list().subscribe(taskTag => {
                            let backupData = {
                                task, project, settings, tag, taskTag
                            } as BackupData;
                            console.log("Backup data: ", backupData);
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
        try {
            const decryptedBackup = AES.decrypt(encryptedData, decryptKey);
            
            console.log("Received the data and here it is after decrypting: ");
            console.log(decryptedBackup.toString(enc.Utf8));
            jsonBackup = JSON.parse(decryptedBackup.toString(enc.Utf8)) as BackupData;
        } catch (error) {
            console.log("Error trying to decrypt or convert json: ", error);
            throw error;
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

        const backupResponse$ = new Subject();

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
            jsonBackup.task[index].dueDate = new Date(value.dueDate as unknown as string);
        });

        return jsonBackup;
    }
}
