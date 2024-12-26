import { EventEmitter, Injectable } from '@angular/core';
import { IDatabaseChange } from 'dexie-observable/api';

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
        console.log("Chamando o DataUpdatedService.next(): ", changes)
        for (const change of changes) {
            this.get(change.table).emit(change);
        }
    }

    subscribe(table: string, func: (changes: any) => void) {
        console.log("Vamos guardar um subscriber para a tabela: ", table)
        return this.get(table).subscribe(func);
    }

    get(table: string) {
        if (!this.eventEmitters[table]) {
            this.eventEmitters[table] = new EventEmitter<any>();
        }
        return this.eventEmitters[table];
    }
}
