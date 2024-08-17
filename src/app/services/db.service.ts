import { Injectable } from '@angular/core';

import { AppDb } from "../app.db";
import { Table } from 'dexie';

@Injectable({
    providedIn: 'root'
})
export class DbService {

    dbService:AppDb = new AppDb();

    getTable(name: string): Table {
        let table = name as keyof AppDb;
        return this.dbService[table] as Table<any, any, any>;
    }

}
