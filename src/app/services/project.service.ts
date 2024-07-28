import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectService<T> extends ServiceAbstract<T> {
    storeName = "project";

    constructor() {
        super();
        this.table = this.dbService.project;
    }
}
