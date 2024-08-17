import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';

@Injectable({
    providedIn: 'root'
})
export class TaskTagService<T> extends ServiceAbstract<T> {
    storeName = "task_tag";
    
    constructor(
        protected dbService: DbService
    ) {
        super();
        this.setTable();
    }
}
