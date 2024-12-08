import { Injectable } from '@angular/core';
import { RxCollection, RxDatabase } from 'rxdb';
import { AppRxDb, MyDatabaseCollections } from "../app.rxdb";

@Injectable({
    providedIn: 'root'
})
export class DbService {
    private db!: RxDatabase<MyDatabaseCollections>;

    async init() {
        this.db = await AppRxDb.getInstance();
    }

    getCollection(name: keyof MyDatabaseCollections): RxCollection {
        return this.db[name];
    }

    getTable(name: keyof MyDatabaseCollections): RxCollection {
        return this.getCollection(name);
    }
}
