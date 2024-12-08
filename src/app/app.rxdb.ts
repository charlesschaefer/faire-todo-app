import {
    createRxDatabase,
    RxDatabase,
    RxCollection,
    addRxPlugin
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

import { TaskDto } from './dto/task-dto';
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
const userSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        email: { type: 'string' },
        name: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        uuid: { type: 'string' },
        avatar_url: { type: 'string' }
    },
    required: ['uuid']
};

const taskSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        dueTime: { type: 'string' },
        project: { type: 'string' },
        completed: { type: 'boolean' },
        order: { type: 'number' },
        parent: { type: 'string' },
        recurring: { type: 'boolean' },
        uuid: { type: 'string' },
        user_uuid: { type: 'string' },
        project_uuid: { type: 'string' },
        parent_uuid: { type: 'string' }
    },
    required: ['title', 'uuid', 'user_uuid']
};

const projectSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        uuid: { type: 'string' },
        user_uuid: { type: 'string' }
    },
    required: ['name', 'uuid', 'user_uuid']
};

const tagSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        uuid: { type: 'string' },
        user_uuid: { type: 'string' }
    },
    required: ['name', 'uuid', 'user_uuid']
};

const taskTagSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        task: { type: 'string' },
        tag: { type: 'string' },
        user_uuid: { type: 'string' },
        task_uuid: { type: 'string' },
        tag_uuid: { type: 'string' }
    },
    required: ['task_uuid', 'tag_uuid', 'user_uuid']
};

const settingsSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        notifications: { type: 'number' },
        todayNotifications: { type: 'number' },
        notificationTime: { type: ['string', 'null'], format: 'date-time' },
        uuid: { type: 'string' },
        user_uuid: { type: 'string' }
    },
    required: ['uuid', 'user_uuid']
};

export type MyDatabaseCollections = {
    users: RxCollection<UserDto>;
    tasks: RxCollection<TaskDto>;
    projects: RxCollection<ProjectDto>;
    tags: RxCollection<TagDto>;
    task_tags: RxCollection<TaskTagDto>;
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
                    user_uuid: crypto.randomUUID()
                });
            }
        }

        return AppRxDb.instance;
    }
} 