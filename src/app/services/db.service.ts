import { Inject, Injectable } from '@angular/core';
import { RxCollection, RxDatabase } from 'rxdb';
import { AppRxDb, MyDatabaseCollections } from "../app.rxdb";

@Injectable({
    providedIn: 'root'
})
export class DbService {
    private db!: RxDatabase<MyDatabaseCollections>;

    constructor(@Inject('AppRxdb') private appRxdb: AppRxDb) {
        // this.appRxdb.db.then(db => this.db = db);
        this.init();
    }

    async init() {
        this.db = await AppRxDb.getInstance();
        return this.db;
    }

    async getCollection(name: keyof MyDatabaseCollections) {
        if (!this.db) {
            const db = await this.init();
            return db.collections[name];
        }
        return this.db.collections[name];
        
    }

    async getTable(name: keyof MyDatabaseCollections) {
        return this.getCollection(name);
    }
}
