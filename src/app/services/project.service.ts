import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { map } from 'rxjs';
import { DbService } from './db.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectService<T> extends ServiceAbstract<T> {
    storeName = "project";

    constructor(
        protected dbService: DbService
    ) {
        super();
        this.setTable();
    }
}
