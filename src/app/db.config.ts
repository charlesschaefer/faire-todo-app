import { DBConfig, NgxIndexedDBModule } from "ngx-indexed-db";

export const dbConfig: DBConfig = {
    name: 'faire-todo-app',
    version: 4,
    objectStoresMeta: [
        {
            store: 'project',
            storeConfig: { keyPath: 'id', autoIncrement: true},
            storeSchema: [
                { name: 'name', keypath: 'name', options: { unique: true }}
            ]
        },
        {
            store: 'tag',
            storeConfig: { keyPath: 'id', autoIncrement: true},
            storeSchema: [
                { name: 'name', keypath: 'name', options: { unique: true }}
            ]
        },
        {
            store: 'task',
            storeConfig: { keyPath: 'id', autoIncrement: true},
            storeSchema: [
                { name: 'title', keypath: 'title', options: { unique: false }},
                { name: 'description', keypath: 'description', options: { unique: false }},
                { name: 'due_date', keypath: 'due_date', options: { unique: false }},
                { name: 'project', keypath: 'project', options: { unique: false }},
            ]
        },
        {
            store: 'task_tag',
            storeConfig: { keyPath: 'id', autoIncrement: true},
            storeSchema: [
                { name: 'task', keypath: 'task', options: { unique: true }},
                { name: 'tag', keypath: 'tag', options: { unique: true }}
            ]
        },
    ]
};