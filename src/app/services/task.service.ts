import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class TaskService<T> extends ServiceAbstract<T> {
    storeName = "task";
}
