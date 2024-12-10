import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Dexie from 'dexie';
import 'dexie-syncable';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { AppDb } from '../app.db';


// Then use it like this:
const Syncable = (Dexie as unknown as { Syncable: any }).Syncable;

@Injectable({
    providedIn: 'root'
})
export class SyncService {
    private supabase: SupabaseClient;
    private syncState = new BehaviorSubject<number>(0);
    private syncConnection: number | undefined;

    constructor(
        private authService: AuthService,
        private db: AppDb
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
                                    await this.supabase.from(change.table).insert(change.obj);
                                    break;
                                case 2: // UPDATE
                                    await this.supabase.from(change.table)
                                        .update(change.obj)
                                        .eq('uuid', change.obj.uuid);
                                    break;
                                case 3: // DELETE
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

    connect() {
        const user = this.authService.currentUser;
        if (!user) {
            return Promise.reject(new Error('User not authenticated'));
        }

        if (this.syncConnection !== undefined) {
            return Promise.resolve(this.syncConnection);
        }

        return this.db.syncable.connect("supabase", environment.supabaseUrl)
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