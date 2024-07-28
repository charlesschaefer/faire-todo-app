import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class TagService<T> extends ServiceAbstract<T> {
    storeName = "tag";

    constructor() {
        super();
        this.table = this.dbService.tag;
    }
}
