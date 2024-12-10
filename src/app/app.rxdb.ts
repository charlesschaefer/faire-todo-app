import {
    createRxDatabase,
    RxDatabase,
    RxCollection,
    addRxPlugin
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxJsonSchema } from 'rxdb';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';


import { RecurringType, TaskDto } from './dto/task-dto';
import { ProjectDto } from './dto/project-dto';
import { TagDto } from './dto/tag-dto';
import { TaskTagDto } from './dto/task-tag-dto';
import { SettingsDto } from './dto/settings-dto';
import { UserDto } from './dto/user-dto';
import { AsyncSubject, firstValueFrom, lastValueFrom, Observable, Subject, takeLast, tap } from 'rxjs';

// Add dev-mode plugin in development
if (process.env['NODE_ENV'] === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBMigrationPlugin);

const migrations: { [key: number]: (db: RxDatabase) => Promise<void> } = {};

for (let i = 1; i <= 11; i++) {
    migrations[i] = (db: RxDatabase) => {
        console.log('Migrating to version', i);
        return Promise.resolve();
    };
}

// Schema definitions
const userSchema: RxJsonSchema<UserDto & { _id?: string }> = {
    version: 11,
    primaryKey: {
        key: '_id',
        fields: ['id', 'uuid'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: { type: 'integer', uniqueItems: true, multipleOf: 1 },
        _id: { type: 'string', maxLength: 100, uniqueItems: true },
        email: { type: 'string' },
        name: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        uuid: { type: 'string', format: 'uuid' },
        avatar_url: { type: 'string' }
    },
    required: ['uuid'],
    additionalProperties: false
};

const taskSchema: RxJsonSchema<TaskDto & {_id?: string}> = {
    version: 11,
    primaryKey: {
        key: '_id',
        fields: ['id', 'uuid'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: { type: 'integer', uniqueItems: true, multipleOf: 1 },
        _id: { type: 'string', maxLength: 100, uniqueItems: true },
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        dueTime: { type: 'string' },
        project: { type: 'integer', default: 0 },
        completed: { type: 'boolean' },
        order: { type: 'integer' },
        parent: { type: 'integer' },
        recurring: { type: 'string', enum: [null, ...Object.values(RecurringType)] },
        uuid: { type: 'string', format: 'uuid' },
        user_uuid: { type: 'string', format: 'uuid' },
        project_uuid: { type: 'string', format: 'uuid' },
        parent_uuid: { type: 'string', format: 'uuid' }
    },
    required: ['title', 'uuid'],
    additionalProperties: false
};

const projectSchema: RxJsonSchema<ProjectDto & {_id?: string}> = {
    version: 11,
    primaryKey: {
        key: '_id',
        fields: ['id', 'uuid'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: { type: 'integer', uniqueItems: true, multipleOf: 1 },
        _id: { type: 'string', maxLength: 100, uniqueItems: true },
        name: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        user_uuid: { type: 'string', format: 'uuid' }
    },
    required: ['name', 'uuid'],
    additionalProperties: false
};

const tagSchema: RxJsonSchema<TagDto & {_id?: string}> = {
    version: 11,
    primaryKey: {
        key: '_id',
        fields: ['id', 'uuid'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: { type: 'integer', uniqueItems: true, multipleOf: 1 },
        _id: { type: 'string', maxLength: 100, uniqueItems: true },
        name: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        user_uuid: { type: 'string', format: 'uuid' }
    },
    required: ['name'],
    additionalProperties: false
};

const taskTagSchema: RxJsonSchema<TaskTagDto> = {
    version: 11,
    primaryKey: {
        key: 'id',
        fields: ['task', 'tag'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100 // <- the primary key must have set maxLength
        },
        task: { type: 'integer', multipleOf: 1, minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
        tag: { type: 'integer', multipleOf: 1, minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
        user_uuid: { type: 'string', format: 'uuid' },
        task_uuid: { type: 'string', format: 'uuid' },
        tag_uuid: { type: 'string', format: 'uuid' },
    },
    required: ['task', 'tag'],
    indexes: ['task', 'tag'],
    additionalProperties: false,
};

const settingsSchema: RxJsonSchema<SettingsDto & {_id?: string}> = {
    version: 11,
    primaryKey: {
        key: '_id',
        fields: ['id', 'uuid'],
        separator: '|'
    },
    type: 'object',
    properties: {
        id: { type: 'integer', uniqueItems: true, multipleOf: 1, minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
        _id: { type: 'string', maxLength: 100, uniqueItems: true },
        notifications: { type: 'integer', default: 0, minimum: 0, maximum: 1 },
        todayNotifications: { type: 'integer', default: 0, minimum: 0, maximum: 1 },
        notificationTime: { type: 'string', format: 'date-time', default: null },
        uuid: { type: 'string', format: 'uuid' },
        user_uuid: { type: 'string', format: 'uuid' }
    },
    required: ['uuid', 'notifications', 'todayNotifications'],
    additionalProperties: false
};

export type MyDatabaseCollections = {
    user: RxCollection<UserDto & {_id?: string}>;
    task: RxCollection<TaskDto & {_id?: string}>;
    project: RxCollection<ProjectDto & {_id?: string}>;
    tag: RxCollection<TagDto & {_id?: string}>;
    task_tag: RxCollection<TaskTagDto & {_id?: string}>;
    settings: RxCollection<SettingsDto & {_id?: string}>;
};

export class AppRxDb {
    private static instance: RxDatabase<MyDatabaseCollections>;
    private static initializationPromise: Promise<RxDatabase<MyDatabaseCollections>> | null = null;
    private static instanceObservable: AsyncSubject<RxDatabase<MyDatabaseCollections>>;

    private selfInstance!: RxDatabase<MyDatabaseCollections>;

    constructor() {
        AppRxDb.getInstance().then(db => this.selfInstance = db);
    }

    get db() {
        return (async () => {
            return this.selfInstance ? this.selfInstance : await AppRxDb.getInstance();
        })();
    }

    // static async getInstance(): Promise<RxDatabase<MyDatabaseCollections>> {
    static async getInstance(): Promise<RxDatabase<MyDatabaseCollections>> {
        if (!AppRxDb.instanceObservable || AppRxDb.instanceObservable.closed) {
            AppRxDb.instanceObservable = new AsyncSubject<RxDatabase<MyDatabaseCollections>>();
            AppRxDb.instanceObservable.pipe(
                tap(console.log)
            )
        }

        // If we already have an instance, return it
        if (AppRxDb.instance) {
            AppRxDb.instanceObservable.next(AppRxDb.instance);
            AppRxDb.instanceObservable.complete();
            return AppRxDb.instance;
        }


        // Start initialization and store the promise
        try {
            AppRxDb.instance = await createRxDatabase<MyDatabaseCollections>({
                name: 'faire_todo_app',
                storage: getRxStorageDexie({
                    autoOpen: true
                }),
                multiInstance: true,
                ignoreDuplicate: true
            });

            console.log('Database created');

            if (!AppRxDb.instance.collections["settings"]) {
                // Create collections
                await AppRxDb.instance.addCollections({
                    user: {
                        schema: userSchema,
                        migrationStrategies: migrations
                    },
                    task: {
                        schema: taskSchema,
                        migrationStrategies: migrations
                    },
                    project: {
                        schema: projectSchema,
                        migrationStrategies: migrations
                    },
                    tag: {
                        schema: tagSchema,
                        migrationStrategies: migrations
                    },
                    task_tag: {
                        schema: taskTagSchema,
                        migrationStrategies: migrations
                    },
                    settings: {
                        schema: settingsSchema,
                        migrationStrategies: migrations
                    }
                });
                console.log('Collections created');
            } else {
                console.log('Collections already created');
            }

            // Initialize default settings if needed
            const settingsCount = await AppRxDb.instance.collections["settings"].count().exec();
            console.log('Settings count', settingsCount);
            if (settingsCount === 0) {
                await AppRxDb.instance.collections["settings"].insert({
                    id: 1,
                    notifications: 1,
                    todayNotifications: 0,
                    notificationTime: null,
                    uuid: crypto.randomUUID(),
                    user_uuid: ''
                });
                console.log('Settings inserted');
            }

            AppRxDb.instanceObservable.next(AppRxDb.instance);
        } finally {
            // Clear the initialization promise once done
            AppRxDb.instanceObservable.complete();
            AppRxDb.instanceObservable.closed = true;
        }

        return lastValueFrom(AppRxDb.instanceObservable);
    }
} 