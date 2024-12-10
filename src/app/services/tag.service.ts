import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { MyDatabaseCollections } from '../app.rxdb';

@Injectable({
    providedIn: 'root'
})
export class TagService<T> extends ServiceAbstract<T> {
    storeName: keyof MyDatabaseCollections = "tag";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

}
