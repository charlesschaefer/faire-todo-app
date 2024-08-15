import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService<T> extends ServiceAbstract<T> {
    
    storeName = "settings";

    constructor(
        protected dbService: DbService
    ) {
        super();
        this.setTable();
    }

}
