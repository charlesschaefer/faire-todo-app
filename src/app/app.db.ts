import {Dexie, Table } from 'dexie';

import { TagDto } from './dto/tag-dto';
import { ProjectDto } from './dto/project-dto';
import { TaskDto } from './dto/task-dto';
import { TaskTagDto } from './dto/task-tag-dto';
import { SettingsAddDto, SettingsDto } from './dto/settings-dto';

export class AppDb extends Dexie {
    task!: Table<TaskDto, number>;
    project!: Table<ProjectDto, number>;
    tag!: Table<TagDto, number>;
    task_tag!: Table<TaskTagDto, number>;
    settings!: Table<SettingsAddDto, number>;

    constructor() {
        super('faire_todo_app');
        this.version(6).stores({
            task: '++id, title, description, dueDate, dueTime, project, completed, order',
            project: '++id, name',
            tag: '++id, name',
            task_tag: 'task, tag'
        });
        this.version(7).stores({
            settings: '++id,notifications,todayNotifications,notificationTime'
        });
        this.version(8).stores({
            task: '++id, title, description, dueDate, dueTime, project, completed, order, parent',
        })
        this.on('populate', () => this.populate());
    }

    populate() {
        this.settings.add({
            notifications: 1,
            todayNotifications: 0,
            notificationTime: null,
        });
    }
}

//export const db = new AppDb();