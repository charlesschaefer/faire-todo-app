import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, from, map } from "rxjs";
import { liveQuery, Table } from "dexie";

import { AppDb, db } from "../db";

@Injectable({ providedIn: 'root' })
export abstract class ServiceAbstract<T> {
    private cache: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
    private useCache: boolean = true;
    abstract storeName: string;
    dbService = db;
    table!: any;

    /**
     * Gets a cached list of accounts
     * 
     * @returns Observable<BaseDto[]>
     */
    list() {
        console.log("called list");
        let subject = new Subject<any>();
        return from(liveQuery(() => this.table.toArray()));
    }

    add(data: T) {
        return from(this.table.add(data));
    }

    bulkAdd(data: T[]) {
        this.clearCache();
        return from(this.table.bulkAdd(data as T & {key?: any}[]));
    }

    edit(id: number, data: T) {
        this.clearCache();
        return from(this.table.update(id, data));/* 
            .pipe(
                map((response: T) => response),
                catchError((error: T) => throwError(error))
            ); */
    }

    get(id: number) {
        return from(liveQuery(() => this.table.where({id: id}).first()));
    }

    getByField(field: string, value: any): Observable<T[]> {
        let where: {[key: string]: any} = {};
        where[field] = value;
        return from(liveQuery(() => this.table.where(where).toArray()));
    }

    count() {
        return from(liveQuery(() => this.table.count()));
    }

    countByField(field: string, value: any) {
        let where: {[key: string]: any} = {};
        where[field] = value;
        return from(liveQuery(() => this.table.where(where).count()));
    }

    getByDate(field: string, minDate?: Date, maxDate?: Date): Observable<T[]> {
        if (!minDate && !maxDate) {
            throw new Error("You should provide at least one of minDate or maxDate parameters!");
        }
        
        let query = this.table.where(field);
        if (minDate && maxDate) {
            query = query.between(minDate, maxDate);
        } else if (minDate) {
            query = query.above(minDate);
        } else {
            query = query.below(maxDate);
        }
        return from(liveQuery(() => query.toArray()));
    }

    // @Todo: finalizar a busca e verificar pq está pegando apenas um item do cursor.
    slowStringSearch(field: string, value: string) {
        return from(liveQuery(() => {
            return this.table.filter((item:T) => {
                return (item[field as keyof T] as string).toLowerCase().match(value.toLowerCase());
            }).toArray()
        }));
    }

    remove(id: number): Observable<any> {
        return from(this.table.delete(id));
    }

    bulkRemove(ids: number[]) {
        return from(this.table.where('id').anyOf(ids).delete());
    }

    clear(): Observable<any> {
        this.clearCache();
        return from(this.table.clear());
    }

    deactivateCache(): void {
        this.useCache = false;
    }

    clearCache(): void {
        this.cache = new BehaviorSubject<T[]>([]);
    }
}