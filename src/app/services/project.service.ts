import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class ProjectService<T> extends ServiceAbstract<T> {
    storeName = "project";
}
