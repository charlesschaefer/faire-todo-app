import { Injectable } from '@angular/core';
import { Table } from 'dexie';

import { AppDb, DeletableTable, TableKeys } from "../app.db";

@Injectable({
    providedIn: 'root'
})
export class DbService {

    dbService: AppDb = new AppDb();

    getTable(name: string) {
        const table = name as TableKeys;
        const entity = this.dbService.getTable(table);
        return entity as Table<DeletableTable<any>, any,DeletableTable<any>>;
    }

}
