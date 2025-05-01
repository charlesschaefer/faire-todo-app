import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface UndoItem {
    data: any;
    type: string;
    // A Subject to watch when "undoing" this item from the queue
    watcher?: Subject<UndoItem>;
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
        if (!item.watcher) {
            item.watcher = new Subject<UndoItem>();
        }
        this.undoQueue.items.push(item);
        this.undoWatch$.next(item);

        return item.watcher ?? this.undo$;
    }

    undo() {
        const item = this.undoQueue.items.pop();
        const watcher = item?.watcher ?? this.undo$;
        watcher.next(item as UndoItem);
    }
}
