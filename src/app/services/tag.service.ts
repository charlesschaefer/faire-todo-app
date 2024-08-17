import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';

@Injectable({
    providedIn: 'root'
})
export class TagService<T> extends ServiceAbstract<T> {
    storeName = "tag";

    constructor(
        protected dbService: DbService
    ) {
        super();
        this.setTable();
    }

}
