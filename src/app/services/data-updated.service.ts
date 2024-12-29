import { EventEmitter, Injectable } from '@angular/core';
import { IDatabaseChange } from 'dexie-observable/api';
import { map } from 'rxjs';
import { DEBUG } from '../app.config';

export type Changes = IDatabaseChange;


@Injectable({
    providedIn: 'root'
})
export class DataUpdatedService {

    private eventEmitters: {[nomeEvento: string]: EventEmitter<any>} = {};

    constructor() { }


    /**
     * This method is used to dispatch changes to the subscribers of DataUpdatedService.
     * It iterates over the changes and for each change, it checks if there is any subscriber for the corresponding table.
     * If there is, it calls the subscriber function with the change as the argument.
     * @param changes - The changes that were applied to the database
     * @see Dexie.Syncable.IDatabaseChange
     */
    next(changes: Changes[]) {
        for (const change of changes) {
            this.get(change.table).emit(change);
        }
    }

    subscribe(table: string, func: (changes: any) => void) {
        return this.get(table).subscribe(func);
    }

    get(table: string) {
        if (!this.eventEmitters[table]) {
            this.eventEmitters[table] = new EventEmitter<any>();
            DEBUG 
                ? this.eventEmitters[table].subscribe((data) => console.log(`O eventEmitter<${table}> foi chamado e entramos no primeiro subscribe dele`)) 
                : null;
        }
        
        return this.eventEmitters[table];
    }
}
