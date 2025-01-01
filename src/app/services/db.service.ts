import { Injectable } from '@angular/core';

import { AppDb } from "../app.db";
import { Table } from 'dexie';

@Injectable({
    providedIn: 'root'
})
export class DbService {

    dbService: AppDb = new AppDb();

    getTable(name: string) {
        const table = name as keyof AppDb;
        const entity = this.dbService[table];
        return entity as Table<any, any, any>;
    }

}
