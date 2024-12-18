import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SettingsService<T> extends ServiceAbstract<T> {
    
    storeName = "settings";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

}
