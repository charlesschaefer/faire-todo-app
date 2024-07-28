import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class TaskTagService<T> extends ServiceAbstract<T> {
    storeName = "task_tag";
    constructor() {
        super();
        this.table = this.dbService.task_tag;
    }
}
