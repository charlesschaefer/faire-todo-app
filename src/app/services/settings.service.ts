import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class SettingsService<T> extends ServiceAbstract<T> {
    
    storeName = "settings";

    constructor() {
        super();
        this.table = this.dbService.settings;
    }
}
