import { Inject, Injectable } from '@angular/core';
import { SupabaseClient, User } from '@supabase/supabase-js';
import Dexie from 'dexie';
import 'dexie-syncable';
import 'dexie-observable';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, firstValueFrom, forkJoin } from 'rxjs';
import { AppDb, TableKeys } from '../app.db';
import { TaskService } from '../task/task.service';
import { TagService } from './tag.service';
import { TaskTagService } from './task-tag.service';
import { SettingsService } from '../settings/settings.service';
import { ProjectService } from '../project/project.service';
import { DbService } from './db.service';
import { UserService } from './user.service';
import { UserDto } from '../dto/user-dto';
import { UserBound } from "../dto/user-bound";
import { ApplyRemoteChangesFunction, IPersistedContext, PollContinuation, ReactiveContinuation } from 'dexie-syncable/api';
import { MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { DataUpdatedService } from './data-updated.service';
import { IDatabaseChange } from 'dexie-observable/api';


const SYNC_INTERVAL = 60000;

// Then use it like this:
// const Syncable = (Dexie as unknown as { Syncable: any }).Syncable;

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    private supabase: SupabaseClient;
    private syncState = new BehaviorSubject<number>(0);
    private syncConnection: number | undefined;
    private rowsUpdated = false;

    constructor(
        private dbService: DbService,
        private authService: AuthService,
        private taskService: TaskService,
        private tagService: TagService,
        private taskTagService: TaskTagService,
        private settingsService: SettingsService,
        private projectService: ProjectService,
        private userService: UserService,
        private messageService: MessageService,
        private translate: TranslocoService,
        private dataUpdatedService: DataUpdatedService,
        @Inject('AppDb') private db: AppDb
    ) {
        this.supabase = this.authService.client;
        if (this.db.verno >= 17) {
            // Register Supabase sync protocol
            Dexie.Syncable.registerSyncProtocol("supabase", {
                sync: async (...parameters) => await this.syncableProtocolHandler(...parameters)
            });
        }
    }

    /**
     * This method is used to handle the syncable protocol.
     * It takes in various parameters and performs the necessary operations for synchronization.
     * @param context - The context of the sync operation.
     * @param url - The URL of the remote server.
     * @param options - The options for the sync operation.
     * @param baseRevision - The current revision on the remote node
     * @param syncedRevision - The last revision we applied to our local database
     * @param changes - The changes to be synced from local db to remote DB. In the first sync trial, it have all local DB data.
     * @param partial - Says if the changes array is all the changes (false) or just a bucket of partial changes (true)
     * @param applyRemoteChanges - The function to apply remote changes. It receives all the changes received from the remote node and will apply to local DB.
     * @param onChangesAccepted - After all the local changes were applied to remote server, call this function to notify dexie about that.
     * @param onSuccess - The function to call when the sync operation is successful (i.e. local changes synced to remote and remote changes synced to local). 
     *                    This will commit the current transaction on local DB.
     * @param onError - The function to call when an error occurs during the sync operation.
     */
    async syncableProtocolHandler(
        context: IPersistedContext | any, 
        url: string, 
        options: any, 
        baseRevision: any, 
        syncedRevision: any, 
        changes: IDatabaseChange[], 
        partial: any,
        applyRemoteChanges: ApplyRemoteChangesFunction, 
        onChangesAccepted: () => void, 
        onSuccess: (continuation: PollContinuation | ReactiveContinuation) => void, 
        onError: (error: any, again?: number) => void
    ) {
        try {
            // stores if this is the first passage by the sync protocol, to allow or not to redirect in the end of sync process
            if (context.first === undefined) {
                context.first = true;
                context.save();
            } else {
                context.first = false;
                context.save();
            }

            const user = this.authService.currentUser;
            if (!user) {
                onError(new Error('User not authenticated'));
                return;
            }

            const tables: TableKeys[] = ['settings', 'project', 'tag', 'task', 'task_tag'];

            // Process local changes
            if (changes.length > 0) {
                try {
                    await this.applyLocalChanges(tables, changes);
                } catch (error: any) {
                    return onError(error);
                }

            }
            onChangesAccepted();

            // Fetch remote changes

            const lastUpdate = new Date(baseRevision);
            const newRevision: Date = new Date();
            const remoteChanges: any[] = await this.fetchRemoteChanges(tables, lastUpdate, newRevision, user);

            if (remoteChanges.length > 0) {
                // await applyRemoteChanges(remoteChanges, Date.now());
                await applyRemoteChanges(remoteChanges, newRevision.getTime(), false, false)
                this.messageService.add({
                    key: 'auth-messages',
                    severity: 'info',
                    summary: await firstValueFrom(this.translate.selectTranslate('New data arrived')),
                    detail: await firstValueFrom(this.translate.selectTranslate('We updated your data with fresh data from the server.')),
                    life: 5000,
                });
            }

            // onSuccess({ again: 6000 }); // Sync again in 1 minute
            onSuccess({ again: SYNC_INTERVAL }); // Sync again in 1 minute
            if (context.first !== undefined && context.first === false && remoteChanges.length) {
                this.dataUpdatedService.next(remoteChanges);
            }
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

    async applyLocalChanges(tables: string[], changes: any) {
        for (let key = 0; key < changes.length; key++) {
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
                        throw new Error(result.error.message);
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
            if (table == 'task') {
                let result = await this.synchronizeTasksWithoutParent(changes);
                if (result?.error && result.error.code !== '23505') {
                    console.error(result.error);
                    throw new Error(result.error.message);
                }

                result = await this.synchronizeTasksWithParent(changes);

                // 23505 means the item is already in the database, so we shouldnt be doing a create query
                if (result?.error && result.error.code !== '23505') {
                    console.error(result.error);
                    throw new Error(result.error.message);
                }
                continue;
            }
            for (const change of changes) {
                if (change.table == table) {
                    const result = await this.syncChange(change);

                    // 23505 means the item is already in the database, so we shouldnt be doing a create query
                    if (result?.error && result.error.code !== '23505') {
                        console.error(result.error);
                        throw new Error(result.error.message);
                    }
                }
            }
        }
    }

    async fetchRemoteChanges(tables: string[], since: Date, newRevision: Date, user: User) {
        const remoteChanges: any[] = [];

        for (const table of tables) {
            const { data, error } = await this.supabase
                .from(table)
                .select('*')
                .eq('user_uuid', user.id)
                .gt('updated_at', since.toISOString());

            if (error) throw error;

            if (data) {
                for (const item of data) {
                    for (const key in item) {
                        // changes all empty *uuid fields from null to '' (empty string)
                        // because of a constraint from indexeddb
                        if (key.indexOf('uuid') !== -1) {
                            if (item[key] === null) {
                                item[key] = '';
                            }
                        }
                        // changes all date fields to Date
                        if (key.match(/(dueDate|dueTime|update_at|created_at|notificationTime)/g)) {
                            if (item[key]) {
                                item[key] = new Date(item[key]);
                            }
                        }
                    }

                    const change: any = {
                        table,
                        key: item.uuid,
                        obj: item,
                    };

                    change['type'] = 1; // CREATE
                    remoteChanges.push(change);
                    const updateDate = new Date(item.updated_at);
                    if (updateDate > newRevision) {
                        newRevision.setTime(updateDate.getTime());
                    }
                }
            }
        }
        return remoteChanges;
    }

    async synchronizeTasksWithoutParent(changes: any[]) {
        return await this._synchronizeTasks(changes, false);
    }

    async synchronizeTasksWithParent(changes: any[]) {
        return await this._synchronizeTasks(changes, true);
    }

    /**
     * Synchronizes the tasks, differentiating with and without parent tasks
     * 
     * @param changes list of changes
     * @param withParent If false, will only process tasks without parent (i.e. parent_uuid empty)
     * @returns `syncChange()` result
     */
    async _synchronizeTasks(changes: any[], withParent = false) {
        let result: any;
        for (const change of changes) {
            if (change.table !== 'task') {
                continue;
            }
            
            if (
                (change.obj && change.obj.parent_uuid !== undefined && (
                    // process only tasks with parent
                    (withParent && !change.obj.parent_uuid) ||
                    // process only tasks without parent
                    (!withParent && change.obj.parent_uuid)
                )) ||
                (change.mods && change.mods.parent_uuid !== undefined && (
                    // process only tasks with parent
                    (withParent && !change.mods.parent_uuid) ||
                    // process only tasks without parent
                    (!withParent && change.mods.parent_uuid)
                )) ||
                // this avoids tasks with partial updates to be processed twice
                withParent && (
                    (change.obj && change.obj.parent_uuid === undefined) ||
                    (change.mods && change.mods.parent_uuid === undefined)
                )
            ) {
                continue;
            }

            result = await this.syncChange(change);

            // 23505 means the item is already in the database, so we shouldnt be doing a create query
            if (result?.error && result.error.code !== '23505') {
                console.error(result.error);
                return result;
            }
        }
        return result;
    }

    async syncChange(change: any) {
        switch (change.type) {
            case 1: // CREATE
                console.log("SyncService.sync() -> CREATE", change);
                return await this.supabase.from(change.table).upsert(change.obj);
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
        if (this.rowsUpdated) {
            const changes = {
                userUpserted: 0,
                taskChanged: 0,
                tagChanged: 0,
                taskTagChanged: 0,
                settingsChanged: 0,
                projectChanged: 0,

            };
            return (new BehaviorSubject<typeof changes>(changes)).asObservable();
        }

        const user = this.authService.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = forkJoin({
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
        result.subscribe(() => this.rowsUpdated = true);
        return result;
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
            return this.db.syncable.on('statusChanged', (newStatus, _url) => {
                console.log("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
                this.syncState.next(newStatus);
            });
        });
    }

    disconnect() {
        // if (this.syncConnection !== undefined) {
        return this.db.syncable.disconnect(environment.supabaseUrl);
        // }
        // return Promise.resolve();
    }

    get syncStatus() {
        return this.syncState.asObservable();
    }

    async fixSynchronization() {
        await this.db._allTables['_intercomm'].clear()
        await this.db._allTables['_changes'].clear()
        this.db._allTables['_syncNodes'].clear().then(() => {
            window.location.reload();
        })
    }
} 
