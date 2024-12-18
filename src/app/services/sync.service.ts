import { Inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Dexie from 'dexie';
import 'dexie-syncable';
import 'dexie-observable';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, forkJoin, from, merge } from 'rxjs';
import { AppDb, TableKeys } from '../app.db';
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
import { UserService } from './user.service';
import { UserDto } from '../dto/user-dto';
import { UserBound } from './service.abstract';
import { ICreateChange, IDatabaseChange, IUpdateChange } from 'dexie-observable/api';


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
        private taskService: TaskService,
        private tagService: TagService,
        private taskTagService: TaskTagService,
        private settingsService: SettingsService,
        private projectService: ProjectService,
        private userService: UserService,
        @Inject('AppDb') private db: AppDb
    ) {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
        if (this.db.verno >= 17) {
            // Register Supabase sync protocol
            Dexie.Syncable.registerSyncProtocol("supabase", {
                sync: async (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) => {
                    /// <param name="context" type="IPersistedContext"></param>
                    /// <param name="url" type="String"></param>
                    /// <param name="changes" type="Array" elementType="IDatabaseChange"></param>
                    /// <param name="applyRemoteChanges" value="function (changes, lastRevision, partial, clear) {}"></param>
                    /// <param name="onSuccess" value="function (continuation) {}"></param>
                    /// <param name="onError" value="function (error, again) {}"></param>
                    try {
                        const user = this.authService.currentUser;
                        if (!user) {
                            onError(new Error('User not authenticated'));
                            return;
                        }

                        const tables: TableKeys[] = ['settings', 'project', 'tag', 'task', 'task_tag'];
                        // const presentKeys: any = {};
                        // // get all the keys available on each table
                        // for (const table of tables) {
                        //     presentKeys[table] = [];
                        //     (await this.db.getTable(table).toArray()).forEach(item => presentKeys[table].push(item.uuid));
                        // }
                        // console.log("PresentKeys: ", presentKeys)

                        // Process local changes
                        if (changes.length > 0) {
                            for (let key = 0; key < changes.length; key++) {
                                // @TODO: check if the settings table already exists and update local table with uuid from remote
                                // @TODO: idea: use the same uuid of user in the settings table.
                                const change = changes[key];
                                if (change.table == 'user' && change.type == 1 /* create */) {
                                    console.log("SyncService.sync() -> CREATE", change);
                                    if (change.obj['user_uuid']) {
                                        delete change.obj['user_uuid'];
                                    }
                                    const result = await this.supabase.from(change.table).insert(change.obj);
                                    if (result.error) {
                                        if (result.error.code !== '23505') {
                                            // this error means that the user already exists in the database
                                            console.error(result.error);
                                            onError(result.error);
                                            return;
                                        }
                                    }
                                    // removes the user from the list of changes.
                                    changes.splice(key, 1);
                                    console.log("REmovendo o usuário da lista de mudanças");
                                    break;
                                }
                            }
                            for (const change of changes) {
                                if (change.type == 1 || change.type == 2) {
                                    for (const key in change.obj) {
                                        // nullifies empty fields to avoid foreign key errors
                                        if (change.obj[key] === '') {
                                            change.obj[key] = null;
                                        }
                                    }
                                }
                            }

                            // sync tables in order, because of foreign keys
                            for (const table of tables) {
                                for (const change of changes) {
                                    if (change.table == table) {
                                        const result = await this.syncChange(change);

                                        // 23505 means the item is already in the database, so we shouldnt be doing a create query
                                        if (result?.error && result.error.code !== '23505') { 
                                            console.error(result.error);
                                            onError(result.error);
                                            return;
                                        }
                                    }
                                }
                            }

                        }
                        onChangesAccepted();

                        // Fetch remote changes
                        const remoteChanges: any[] = [];

                        const lastUpdate = new Date(baseRevision);
                        let newRevision: Date = new Date();
                        for (const table of tables) {
                            const { data, error } = await this.supabase
                                .from(table)
                                .select('*')
                                .eq('user_uuid', user.id)
                                .gt('updated_at', lastUpdate.toISOString());

                            if (error) throw error;

                            if (data) {
                                for (const item of data) {
                                    // await this.db.transaction('r!', this.db.getTable(table), async () => {
                                    // await Dexie.ignoreTransaction(async () => {
                                        // const exists = await this.db.getTable(table).get(item.uuid);
                                        // const exists = await this.db.getTable(table).where('uuid').equals(item.uuid).count();
                                        let change: any = {
                                            table,
                                            key: item.uuid,
                                            obj: item,
                                        };
                                        // if (exists) {
                                        //     change = {
                                        //         ...change, 
                                        //         type: 2, // UPDATE
                                        //         // oldObj: exists
                                        //     };
                                        // } else {
                                            change['type'] = 1; // CREATE
                                        // }
                                        remoteChanges.push(change);
                                        newRevision = new Date(item.updated_at);

                                    // });
                                }
                            }
                        }

                        if (remoteChanges.length > 0) {
                            // await applyRemoteChanges(remoteChanges, Date.now());
                            await applyRemoteChanges(remoteChanges, newRevision.getTime(), false, false)
                        }

                        onSuccess({ again: 60000 }); // Sync again in 1 minute
                        // onSuccess({
                        //     react: (changes, baseRevision, partial, onChangesAccepted) => {
                        //         console.log("Changes: ", changes);
                        //     },
                        //     disconnect: () => {
                        //         this.disconnect();
                        //     }
                        // })
                    } catch (error) {
                        onError(error);
                    }
                }
            });
        }
    }

    async syncChange(change: any) {
        switch (change.type) {
            case 1: // CREATE
                console.log("SyncService.sync() -> CREATE", change);
                return await this.supabase.from(change.table).insert(change.obj);
                break;
            case 2: // UPDATE
                console.log("SyncService.sync() -> UPDATE", change);
                return await this.supabase.from(change.table)
                    .update(change.mods)
                    .eq('uuid', change.key);
                break;
            case 3: // DELETE
                console.log("SyncService.sync() -> DELETE", change);
                return await this.supabase.from(change.table)
                    .delete()
                    .eq('uuid', change.key);
                break;
            default: 
                throw Error("Not a valid change type");
        }
    }

    updateRowsUserUuid() {
        const user = this.authService.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        return forkJoin({
            userUpserted: this.userService.upsert({
                avatar_url: user.user_metadata["avatar_url"],
                created_at: new Date(user.created_at),
                email: user.email as string,
                id: 1,
                name: user.user_metadata['name'],
                uuid: user.id
            } as UserDto & UserBound),
            taskChanged: this.taskService.updateUserUUID(),
            tagChanged: this.tagService.updateUserUUID(),
            taskTagChanged: this.taskTagService.updateUserUUID(),
            settingsChanged: this.settingsService.updateUserUUID(),
            projectChanged: this.projectService.updateUserUUID(),
        });
    }

    async connect() {
        if (this.db.verno < 17) {
            throw new Error('Wrong version of the database');
        }
        const user = this.authService.currentUser;
        if (!user) {
            return Promise.reject(new Error('User not authenticated'));
        }

        if (this.syncConnection !== undefined) {
            console.info("We're already connected");
            return Promise.resolve(this.syncConnection);
        }

        return (this.db as AppDb).syncable.connect("supabase", environment.supabaseUrl).then(() => {
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