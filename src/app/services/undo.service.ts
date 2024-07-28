import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface UndoItem {
    data: any;
    type: string;
}

interface UndoQueue {
    items: UndoItem[];
}

@Injectable({
    providedIn: 'root'
})
export class UndoService {
    undoQueue: UndoQueue = {items: []};
    undo$ = new Subject<UndoItem>();
    undoWatch$ = new Subject<UndoItem>();

    watch() {
        return this.undoWatch$;
    }

    register(item: UndoItem) {
        this.undoQueue.items.push(item);
        console.log("Chamando quem estava assistindo o undoWatch$");
        this.undoWatch$.next(item);
        return this.undo$;
    }

    undo() {
        let item = this.undoQueue.items.pop();
        this.undo$.next(item as UndoItem);
    }
}
