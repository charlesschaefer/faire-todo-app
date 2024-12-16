import { Inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Dexie from 'dexie';
import 'dexie-syncable';
import 'dexie-observable';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { AppDb } from '../app.db';
import { TaskService } from './task.service';
import { TagService } from './tag.service';
import { TaskTagService } from './task-tag.service';
import { SettingsService } from './settings.service';
import { ProjectService } from './project.service';
import { TaskDto } from '../dto/task-dto';
import { TagDto } from '../dto/tag-dto';
import { TaskTagDto } from '../dto/task-tag-dto';
import { SettingsDto } from '../dto/settings-dto';
import { ProjectDto } from '../dto/project-dto';
import { DbService } from './db.service';


// Then use it like this:
const Syncable = (Dexie as unknown as { Syncable: any }).Syncable;

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    private supabase: SupabaseClient;
    private syncState = new BehaviorSubject<number>(0);
    private syncConnection: number | undefined;

    constructor(
        private dbService: DbService,
        private authService: AuthService,
        private taskService: TaskService<TaskDto>,
        private tagService: TagService<TagDto>,
        private taskTagService: TaskTagService<TaskTagDto>,
        private settingsService: SettingsService<SettingsDto>,
        private projectService: ProjectService<ProjectDto>,
        @Inject('AppDb') private db: AppDb
    ) {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );

        // Register Supabase sync protocol
        Dexie.Syncable.registerSyncProtocol("supabase", {
            sync: async (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) => {
                try {
                    const user = this.authService.currentUser;
                    if (!user) {
                        onError(new Error('User not authenticated'));
                        return;
                    }

                    // Process local changes
                    if (changes.length > 0) {
                        for (const change of changes) {
                            // const { type, table, key, obj } = change;
                            
                            switch (change.type) {
                                case 1: // CREATE
                                    console.log("SyncService.sync() -> CREATE", change);
                                    await this.supabase.from(change.table).insert(change.obj);
                                    break;
                                case 2: // UPDATE
                                    console.log("SyncService.sync() -> UPDATE", change);
                                    await this.supabase.from(change.table)
                                        .update(change.mods)
                                        .eq('uuid', change.mods?.["uuid"]);
                                    break;
                                case 3: // DELETE
                                    console.log("SyncService.sync() -> DELETE", change);
                                    await this.supabase.from(change.table)
                                        .delete()
                                        .eq('uuid', change.key);
                                    break;
                            }
                        }
                        onChangesAccepted();
                    }

                    // Fetch remote changes
                    const tables = ['task', 'project', 'tag', 'task_tag', 'settings'];
                    const remoteChanges: any[] = [];

                    for (const table of tables) {
                        const { data, error } = await this.supabase
                            .from(table)
                            .select('*')
                            .eq('user_uuid', user.id)
                            .gt('updated_at', baseRevision || '1970-01-01');

                        if (error) throw error;

                        if (data) {
                            data.forEach(item => {
                                remoteChanges.push({
                                    type: 2, // UPDATE
                                    table,
                                    key: item.uuid,
                                    obj: item
                                });
                            });
                        }
                    }

                    if (remoteChanges.length > 0) {
                        await applyRemoteChanges(remoteChanges, Date.now());
                    }

                    onSuccess({ again: 60000 }); // Sync again in 1 minute
                } catch (error) {
                    onError(error);
                }
            }
        });
    }

    async connect() {
        const user = this.authService.currentUser;
        if (!user) {
            return Promise.reject(new Error('User not authenticated'));
        }

        // updates all tables with the user uuid
        await this.taskService.updateUserUUID();
        await this.tagService.updateUserUUID();
        await this.taskTagService.updateUserUUID();
        await this.settingsService.updateUserUUID();
        await this.projectService.updateUserUUID();

        if (this.syncConnection !== undefined) {
            return Promise.resolve(this.syncConnection);
        }
        (this.db as AppDb).syncable.connect
        return this.db.syncable.connect("supabase", environment.supabaseUrl).then(() => {
            this.syncConnection = 1;
            return this.db.syncable.on('statusChanged', (newStatus, url) => {
                console.log("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
                this.syncState.next(newStatus);
            });
        });
    }

    disconnect() {
        if (this.syncConnection !== undefined) {
            return this.db.syncable.disconnect(environment.supabaseUrl);
        }
        return Promise.resolve();
    }

    get syncStatus() {
        return this.syncState.asObservable();
    }
} 