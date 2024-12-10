import {
    createRxDatabase,
    RxDatabase,
    RxCollection,
    addRxPlugin
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxJsonSchema } from 'rxdb';

import { RecurringType, TaskDto } from './dto/task-dto';
import { ProjectDto } from './dto/project-dto';
import { TagDto } from './dto/tag-dto';
import { TaskTagDto } from './dto/task-tag-dto';
import { SettingsDto } from './dto/settings-dto';
import { UserDto } from './dto/user-dto';

// Add dev-mode plugin in development
if (process.env['NODE_ENV'] === 'development') {
    addRxPlugin(RxDBDevModePlugin);
}

// Schema definitions
const userSchema: RxJsonSchema<UserDto> = {
    version: 11,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'integer',  },
        email: { type: 'string' },
        name: { type: 'string' },
        created_at: { type: 'string', format: 'date-time', default: new Date().toLocaleDateString() },
        uuid: { type: 'string', default: crypto.randomUUID() },
        avatar_url: { type: 'string' }
    },
    required: ['uuid']
};

const taskSchema: RxJsonSchema<TaskDto> = {
    version: 11,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'integer'},
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        dueTime: { type: 'string' },
        project: { type: 'integer' },
        completed: { type: 'boolean' },
        order: { type: 'integer' },
        parent: { type: 'integer' },
        recurring: { type: 'string', enum: [null, ...Object.values(RecurringType)] },
        uuid: { type: 'string', default: crypto.randomUUID() },
        user_uuid: { type: 'string' },
        project_uuid: { type: 'string' },
        parent_uuid: { type: 'string' }
    },
    required: ['title', 'uuid']
};

const projectSchema: RxJsonSchema<ProjectDto> = {
    version: 11,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'integer', },
        name: { type: 'string' },
        uuid: { type: 'string', default: crypto.randomUUID() },
        user_uuid: { type: 'string' }
    },
    required: ['name', 'uuid']
};

const tagSchema: RxJsonSchema<TagDto> = {
    version: 11,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'integer'},
        name: { type: 'string' },
        uuid: { type: 'string', default: crypto.randomUUID() },
        user_uuid: { type: 'string' }
    },
    required: ['name']
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
        task: { type: 'integer' },
        tag: { type: 'integer' },
        user_uuid: { type: 'string' },
        task_uuid: { type: 'string' },
        tag_uuid: { type: 'string' },
    },
    required: ['task', 'tag']
};

const settingsSchema: RxJsonSchema<SettingsDto> = {
    version: 11,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'integer'},
        notifications: { type: 'integer', default: 0, minimum: 0, maximum: 1 },
        todayNotifications: { type: 'integer', default: 0, minimum: 0, maximum: 1 },
        notificationTime: { type: 'string', format: 'date-time', default: null },
        uuid: { type: 'string', default: crypto.randomUUID() },
        user_uuid: { type: 'string' }
    },
    required: ['uuid', 'notifications', 'todayNotifications']
};

export type MyDatabaseCollections = {
    user: RxCollection<UserDto>;
    task: RxCollection<TaskDto>;
    project: RxCollection<ProjectDto>;
    tag: RxCollection<TagDto>;
    task_tag: RxCollection<TaskTagDto>;
    settings: RxCollection<SettingsDto>;
};

export class AppRxDb {
    private static instance: RxDatabase<MyDatabaseCollections>;

    static async getInstance(): Promise<RxDatabase<MyDatabaseCollections>> {
        if (!AppRxDb.instance) {
            AppRxDb.instance = await createRxDatabase<MyDatabaseCollections>({
                name: 'faire_todo_app',
                storage: getRxStorageDexie(),
                multiInstance: true,
                ignoreDuplicate: true
            });

            // Create collections
            await AppRxDb.instance.addCollections({
                users: {
                    schema: userSchema
                },
                tasks: {
                    schema: taskSchema
                },
                projects: {
                    schema: projectSchema
                },
                tags: {
                    schema: tagSchema
                },
                task_tags: {
                    schema: taskTagSchema
                },
                settings: {
                    schema: settingsSchema
                }
            });

            // Initialize with default settings if needed
            const settingsCount = await AppRxDb.instance.settings.count().exec();
            if (settingsCount === 0) {
                await AppRxDb.instance.settings.insert({
                    id: 1,
                    notifications: 1,
                    todayNotifications: 0,
                    notificationTime: null,
                    uuid: crypto.randomUUID(),
                    user_uuid: ''
                });
            }
        }

        return AppRxDb.instance;
    }
} 