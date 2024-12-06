import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class TaskTagService<T> extends ServiceAbstract<T> {
    storeName = "task_tag";
    
    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }
}
