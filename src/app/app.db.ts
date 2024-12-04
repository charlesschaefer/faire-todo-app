import {Dexie, Table } from 'dexie';

import { TagDto } from './dto/tag-dto';
import { ProjectDto } from './dto/project-dto';
import { TaskDto } from './dto/task-dto';
import { TaskTagDto } from './dto/task-tag-dto';
import { SettingsAddDto, SettingsDto } from './dto/settings-dto';
import { UserDto } from './dto/user-dto';

export class AppDb extends Dexie {
    task!: Table<TaskDto, number>;
    project!: Table<ProjectDto, number>;
    tag!: Table<TagDto, number>;
    task_tag!: Table<TaskTagDto, number>;
    settings!: Table<SettingsAddDto, number>;
    user!: Table<UserDto, number>;

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
        }).upgrade(async transaction => {
            try {
                // create a new user register, since we hadn't one before
                const users = (await transaction.table('user').toArray());

                let user: UserDto;
                if (users.length == 0) {
                    user = await transaction.table('user').add({
                        uuid: crypto.randomUUID(),
                        email: '',
                        name: '',
                        created_at: new Date()
                    });
                } else {
                    user = users[0];
                }
                
                const tables = ['task', 'project', 'tag', 'settings'];
                tables.forEach(table => {
                    // Add uuid to all items if not already present
                    transaction.table(table).toCollection().modify(item => {
                        if (!item.uuid) {
                            item.uuid = crypto.randomUUID();
                        }
                        item.user_uuid = user.uuid;
                    });
                });

                const projectsMap = new Map<number, string>(
                    (await transaction.table('project').toArray())
                    .map(project => [project.id, project.uuid])
                );
                const tasksMap = new Map<number, string>(
                    (await transaction.table('task').toArray())
                    .map(task => [task.id, task.uuid])
                );
                const tagsMap = new Map<number, string>(
                    (await transaction.table('tag').toArray())
                    .map(tag => [tag.id, tag.uuid])
                );

                // Fills the foreign keys with the uuid of the item
                transaction.table('task').toCollection().modify(async (item: TaskDto) => {
                    item.project_uuid = item.project ? projectsMap.get(item.project) as string : null;
                    item.parent_uuid = item.parent ? tasksMap.get(item.parent) as string : null;
                    item.user_uuid = user.uuid;
                });

                transaction.table("task_tag").toCollection().modify(async (item: TaskTagDto) => {
                    item.task_uuid = item.task ? tasksMap.get(item.task) as string : '';
                    item.tag_uuid = item.tag ? tagsMap.get(item.tag) as string : '';
                    item.user_uuid = user.uuid;
                });
            } catch (error) {
                transaction.abort();
                alert("Error upgrading database" + error);
                throw error;
            }
        });

        this.on('populate', () => this.populate());
    }

    populate() {
        this.settings.add({
            notifications: 1,
            todayNotifications: 0,
            notificationTime: null,
            // uuid: crypto.randomUUID(),
            // user_uuid: crypto.randomUUID()
        } as SettingsAddDto);
    }
}

//export const db = new AppDb();