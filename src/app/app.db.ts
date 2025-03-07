import { Dexie, Table } from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';
import { v4 } from 'uuid';

import { ProjectDto } from './dto/project-dto';
import { SettingsAddDto, SettingsDto } from './dto/settings-dto';
import { TagDto } from './dto/tag-dto';
import { TaskDto } from './dto/task-dto';
import { TaskTagDto } from './dto/task-tag-dto';
import { UserDto } from './dto/user-dto';

const randomUUID: any = v4;

Dexie.debug = true

function runTaskSerial(fn: CallableFunction, results: any) {
     
    return fn(results);
}

export type TableKeys = 'task' | 'project' | 'tag' | 'task_tag' | 'settings' | 'user';
export type DeletableTable<Table> = Table & { deleted?: number, deletedAt?: Date };

export class AppDb extends Dexie {
    task!: Table<DeletableTable<TaskDto>, number>;
    project!: Table<DeletableTable<ProjectDto>, number>;
    tag!: Table<DeletableTable<TagDto>, number>;
    task_tag!: Table<DeletableTable<TaskTagDto>, number>;
    settings!: Table<DeletableTable<SettingsAddDto>, number>;
    user!: Table<DeletableTable<UserDto>, number>;

    constructor() {
        super('faire_todo_app');
        
        this.version(6).stores({
            task: '++id, title, description, dueDate, dueTime, project, completed, order',
            project: '++id, name',
            tag: '++id, name',
            task_tag: 'task, tag'
        });
        this.version(7).stores({
            settings: '++id, notifications, todayNotifications, notificationTime'
        });
        this.version(8).stores({
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent',
        })
        this.version(9).stores({
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent, recurring'
        })
        this.version(10).stores({
            user: '++id, email, name, created_at, uuid',
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent, recurring, uuid, user_uuid, project_uuid, parent_uuid',
            project: '++id, name, uuid, user_uuid',
            tag: '++id, name, uuid, user_uuid',
            task_tag: 'task, tag, user_uuid, task_uuid, tag_uuid',
            settings: '++id, notifications, todayNotifications, notificationTime, uuid, user_uuid',
        }).upgrade(transaction => {
            try {
                // create a new user register, since we hadn't one before
                const serialFns = {
                    createUser: () =>transaction.table<UserDto, number>('user').add({
                        uuid: randomUUID(),
                        email: '',
                        name: '',
                        created_at: new Date()
                    } as UserDto, 1),
                    getUser:(userId: number) => transaction.table<UserDto>('user').get(userId),
                    addUuidToItems: (user: UserDto) => Promise.all([
                        transaction.table<TaskDto, number>('task').toCollection().modify(item => {
                            if (!item.uuid) {
                                item.uuid = randomUUID();
                            }
                            item.user_uuid = user.uuid;
                        }),
                        transaction.table<ProjectDto, number>('project').toCollection().modify(item => {
                            if (!item.uuid) {
                                item.uuid = randomUUID();
                            }
                            item.user_uuid = user.uuid;
                        }),
                        transaction.table<TagDto, number>('tag').toCollection().modify(item => {
                            if (!item.uuid) {
                                item.uuid = randomUUID();
                            }
                            item.user_uuid = user.uuid;
                        }),
                        transaction.table<SettingsDto, number>('settings').toCollection().modify(item => {
                            if (!item.uuid) {
                                item.uuid = randomUUID();
                            }
                            item.user_uuid = user.uuid;
                        })
                    ]),
                    getProjects: () => transaction.table<ProjectDto, number>('project').toArray(),
                    getProjectMap: (projects: ProjectDto[]): Map<number, string> => {
                        return new Map<number, string>(projects.map(project => [project.id, project.uuid]));
                    },
                    getTaskMap: (projectMap: Map<number, string>) => transaction.table<TaskDto>('task').toArray().then(tasks => {
                        return [new Map<number, string>(tasks.map(task => [task.id, task.uuid])), projectMap];
                    }),
                    getTagMap: ([tasksMap, projectsMap]: Map<number, string>[]) => transaction.table<TagDto>('tag').toArray().then(tags => {
                        return [tasksMap, projectsMap, new Map<number, string>(tags.map(tag => [tag.id, tag.uuid]))];
                    }),
                    addForeignKeysUUID: ([tasksMap, projectsMap, tagsMap]: Map<number, string>[]) => Promise.all([
                        transaction.table('task').toCollection().modify((item: TaskDto) => {
                            item.project_uuid = item.project ? projectsMap.get(item.project) as string : '';
                            item.parent_uuid = item.parent ? tasksMap.get(item.parent) as string : '';
                        }),
                        transaction.table("task_tag").toCollection().modify((item: TaskTagDto) => {
                            item.task_uuid = item.task ? tasksMap.get(item.task) as string : '';
                            item.tag_uuid = item.tag ? tagsMap.get(item.tag) as string : '';
                        })
                    ])
                };
                
                Object.values(serialFns).reduce(
                    (promise, nextFunction) => {
                        return promise.then(
                            previousPromiseResult => runTaskSerial(nextFunction, previousPromiseResult)
                        );
                    },
                    Promise.resolve()
                );
            } catch (error) {
                transaction.abort();
                alert("Error upgrading database" + error);
                throw error;
            }
        });

        this.version(11).stores({
            user: '++id, email, name, created_at, uuid, avatar_url',
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent, recurring, uuid, user_uuid, project_uuid, parent_uuid',
            project: '++id, name, uuid, user_uuid',
            tag: '++id, name, uuid, user_uuid',
            task_tag: 'task, tag, user_uuid, task_uuid, tag_uuid',
            settings: '++id, notifications, todayNotifications, notificationTime, uuid, user_uuid',
        });
        
        this.version(12).stores({
            user: '++id, email, name, created_at, uuid, avatar_url',
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent, recurring, uuid, user_uuid, project_uuid, parent_uuid, updated_at',
            project: '++id, name, uuid, user_uuid, updated_at',
            tag: '++id, name, uuid, user_uuid, updated_at',
            task_tag: 'task, tag, user_uuid, task_uuid, tag_uuid, updated_at',
            settings: '++id, notifications, todayNotifications, notificationTime, uuid, user_uuid, updated_at',
        });

        this.version(13).stores({
            // user: null,
            user_temp: '$$uuid, email, name, created_at, avatar_url',
            // task: null,
            task_temp: '$$uuid, title, description, dueDate, dueTime, project, completed, order, parent, recurring, user_uuid, project_uuid, parent_uuid, updated_at',
            // project: null,
            project_temp: '$$uuid, name, user_uuid, updated_at',
            // tag: null,
            tag_temp: '$$uuid, name, user_uuid, updated_at',
            task_tag: 'task, tag, user_uuid, task_uuid, tag_uuid, updated_at',
            // settings: null,
            settings_temp: '$$uuid, notifications, todayNotifications, notificationTime, user_uuid, updated_at',
        }).upgrade(async transaction => {
            const tasks = (await transaction.table('task').toArray()).map((item) => {
                const newItem: Record<string, any> = {};
                Object.keys(item).forEach(key => key !== 'id' ? newItem[key] = item[key] : null);
                return newItem;
            });
            await transaction.table('task_temp').bulkAdd(tasks).catch(console.error);

            const projects = (await transaction.table('project').toArray()).map((item) => {
                const newItem: Record<string, any> = {};
                Object.keys(item).forEach(key => key !== 'id' ? newItem[key] = item[key] : null);
                return newItem;
            });
            await transaction.table('project_temp').bulkAdd(projects).catch(console.error);

            const tags = (await transaction.table('tag').toArray()).map((item) => {
                const newItem: Record<string, any> = {};
                Object.keys(item).forEach(key => key !== 'id' ? newItem[key] = item[key] : null);
                return newItem;
            });
            await transaction.table('tag_temp').bulkAdd(tags).catch(console.error);

            const settings = (await transaction.table('settings').toArray()).map((item) => {
                const newItem: Record<string, any> = {};
                Object.keys(item).forEach(key => key !== 'id' ? newItem[key] = item[key] : null);
                return newItem;
            });
            await transaction.table('settings_temp').bulkAdd(settings).catch(console.error);
        });

        this.version(14).stores({
            user: null,
            // user_temp: '$$uuid, email, name, created_at, avatar_url',
            task: null,
            // task_temp: '$$uuid, title, description, dueDate, dueTime, project, completed, order, parent, recurring, user_uuid, project_uuid, parent_uuid, updated_at',
            project: null,
            // project_temp: '$$uuid, name, user_uuid, updated_at',
            tag: null,
            // tag_temp: '$$uuid, name, user_uuid, updated_at',
            settings: null,
            // settings_temp: '$$uuid, notifications, todayNotifications, notificationTime, user_uuid, updated_at',
        });

        this.version(15).stores({
            user: '$$uuid, email, name, created_at, avatar_url',
            task: '$$uuid, title, description, dueDate, dueTime, project, completed, order, parent, recurring, user_uuid, project_uuid, parent_uuid, updated_at',
            project: '$$uuid, name, user_uuid, updated_at',
            tag: '$$uuid, name, user_uuid, updated_at',
            settings: '$$uuid, notifications, todayNotifications, notificationTime, user_uuid, updated_at',
        }).upgrade(async transaction => {
            const tasks = await transaction.table('task_temp').toArray();
            await transaction.table('task').bulkAdd(tasks).catch(console.error);

            const projects = await transaction.table('project_temp').toArray();
            await transaction.table('project').bulkAdd(projects).catch(console.error);

            const tags = await transaction.table('tag_temp').toArray();
            await transaction.table('tag').bulkAdd(tags).catch(console.error);

            const settings = await transaction.table('settings_temp').toArray();
            await transaction.table('settings').bulkAdd(settings).catch(console.error);
        });

        this.version(16).stores({
            user_temp: null,
            task_temp: null,
            project_temp: null,
            tag_temp: null,
            settings_temp: null,
        });

        this.version(17).stores({
            user: '$$uuid, id, email, name, created_at, avatar_url',
            task: '$$uuid, id, title, description, dueDate, dueTime, project, completed, order, parent, recurring, user_uuid, project_uuid, parent_uuid, updated_at',
            project: '$$uuid, id, name, user_uuid, updated_at',
            tag: '$$uuid, id, name, user_uuid, updated_at',
            settings: '$$uuid, id, notifications, todayNotifications, notificationTime, user_uuid, updated_at',
        });

        this.version(18).stores({
            user: '$$uuid, id, email, name, created_at, avatar_url, updated_at',
        });

        this.version(19).stores({
            task: '$$uuid, [project_uuid+completed], [parent_uuid+completed], project_uuid, parent_uuid, completed, id, title, description, dueDate, dueTime, project, order, parent, recurring, user_uuid, updated_at',
        });

        this.version(20).stores({
            settings: '$$uuid, id, notifications, todayNotifications, notificationTime, user_uuid, updated_at, autostart',
        });

        // @TODO: check if this version should be 20 or 21
        this.version(21).stores({
            task: '$$uuid, [project_uuid+completed], [parent_uuid+completed], project_uuid, parent_uuid, completed, id, title, description, dueDate, dueTime, project, order, parent, recurring, user_uuid, updated_at, originalDueDate',
        }).upgrade(async transaction => {
            (await transaction.table('task').toArray()).map((item) => {
                if (item.dueDate) {
                    item.originalDueDate = item.dueDate;
                }
                transaction.table('task').update(item.uuid, item);
            });
        });

        this.version(22).stores({
            task: '$$uuid, [project_uuid+completed], [parent_uuid+completed], project_uuid, parent_uuid, completed, id, title, description, dueDate, dueTime, project, order, parent, recurring, user_uuid, updated_at, originalDueDate, deleted, deletedAt',
            project: '$$uuid, id, name, user_uuid, updated_at, deleted, deletedAt',
            tag: '$$uuid, id, name, user_uuid, updated_at, deleted, deletedAt',
            settings: '$$uuid, id, notifications, todayNotifications, notificationTime, user_uuid, updated_at, autostart, deleted, deletedAt',
            user: '$$uuid, id, email, name, created_at, avatar_url, updated_at, deleted, deletedAt'
        });

        this.on('populate', () => this.populate());
    }

    populate() {
        this.settings.add({
            notifications: 1,
            todayNotifications: 0,
            notificationTime: null,
        } as SettingsAddDto);
    }

    getTable(table: TableKeys): Table<DeletableTable<any>, number> {
        return this[table];
    }

    async softDelete(table: TableKeys, id: number) {
        const record = await this[table].get(id);
        if (record) {
            record.deleted = 1;
            record.deletedAt = new Date();
            await this.getTable(table).update(id, record);
        }
        this.getTable(table).delete
    }

    async getNonDeletedRecords(table: TableKeys) {
        return this[table].where('deleted').notEqual(1).toArray();
    }

    async updateNonDeletedRecord(table: TableKeys, id: number, changes: Partial<any>) {
        const record = await this[table].get(id);
        if (record && record.deleted !== 1) {
            await this.getTable(table).update(id, changes);
        }
    }
}
