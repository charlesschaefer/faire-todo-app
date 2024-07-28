import { Injectable } from "@angular/core";
import { NgxIndexedDBService } from "ngx-indexed-db";
import { BehaviorSubject, Observable, Subject, catchError, count, map, reduce, throwError } from "rxjs";

@Injectable({ providedIn: 'root' })
export abstract class ServiceAbstract<T> {
    private cache: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
    private useCache: boolean = true;
    abstract storeName: string;

    constructor(
        protected dbService: NgxIndexedDBService
    ) {}

    /**
     * Gets a cached list of accounts
     * 
     * @returns Observable<BaseDto[]>
     */
    list(): Observable<T[]> {
        // TODO: it is fetching from cache, but not storing in it
        if (this.useCache && this.cache.getValue().length) {
            return new Observable<T[]>((observer) => {
                observer.next(this.cache.getValue());
            });
        }
        let cached = this.dbService.getAll<T>(this.storeName);
        cached.subscribe(value => this.cache  = new BehaviorSubject<T[]>(value));
        return cached;
    }

    add(data: T) {
        this.clearCache();
        return this.dbService.add(this.storeName, data);
    }

    bulkAdd(data: T[]): Observable<number[]> {
        this.clearCache();
        return this.dbService.bulkAdd(this.storeName, data as T & {key?: any}[]);
    }

    edit(data: T): Observable<T> {
        this.clearCache();
        return this.dbService.update(this.storeName, data);/* 
            .pipe(
                map((response: T) => response),
                catchError((error: T) => throwError(error))
            ); */
    }

    get(id: number): Observable<T> {
        return this.dbService.getByID<T>(this.storeName, id);
    }

    getByField(field: string, value: any): Observable<T[]> {
        return this.dbService.getAllByIndex(this.storeName, field, IDBKeyRange.only(value)) as Observable<T[]>;
    }

    count(): Observable<number> {
        return this.dbService.count(this.storeName);
    }

    countByField(field: string, value: any): Observable<number> {
        let data$ = this.getByField(field, value);
        return data$.pipe(
            map((value) => {
                return value.length;
            })
        );
    }

    getByDate(field: string, minDate?: Date, maxDate?: Date): Observable<T[]> {
        if (!minDate && !maxDate) {
            throw new Error("You should provide at least one of minDate or maxDate parameters!");
        }
        let keyRange: IDBKeyRange;
        if (!minDate) {
            keyRange = IDBKeyRange.upperBound(maxDate);
        } else if (!maxDate) {
            keyRange = IDBKeyRange.lowerBound(minDate);
        } else {
            keyRange = IDBKeyRange.bound(minDate, maxDate);
        }
        return this.dbService.getAllByIndex(this.storeName, field, keyRange) as Observable<T[]>;
    }

    // @Todo: finalizar a busca e verificar pq está pegando apenas um item do cursor.
    slowStringSearch(field: string, value: string): Observable<T[]> {
        let results: T[] = [];
        const searchResult$ = new Subject<T[]>;
        this.dbService.openCursor(this.storeName).subscribe({
            next: event => {
                let cursor = (event.target as IDBOpenDBRequest).result as unknown as IDBCursorWithValue;
                if (cursor) {
                    let tValue = cursor.value as T;
                    let fieldValue = tValue[field as keyof T] as string;
                    console.log(`Achou ${value} em ${fieldValue}`);
                    if (fieldValue.match(value)) {
                        results.push(cursor.value as T);
                    }
                    console.log("Cursor: ", cursor);
                    cursor.advance(1);
                } else {
                    console.log("Todos exibidos");
                }
            },
            complete: () => searchResult$.next(results),
            error: (err) => console.error(err)
        });
        return searchResult$;
    }

    remove(id: number): Observable<any> {
        this.clearCache();
        return this.dbService.deleteByKey(this.storeName, id);
    }

    bulkRemove(ids: number[]) {
        return this.dbService.bulkDelete(this.storeName, ids);
    }

    clear(): Observable<any> {
        this.clearCache();
        return this.dbService.clear(this.storeName);
    }

    deactivateCache(): void {
        this.useCache = false;
    }

    clearCache(): void {
        this.cache = new BehaviorSubject<T[]>([]);
    }
}