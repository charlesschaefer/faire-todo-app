import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, from } from "rxjs";
import { liveQuery, Table } from "dexie";
import { RxCollection } from 'rxdb';

import { DbService } from "./db.service";
import { MyDatabaseCollections } from "../app.rxdb";
import { User } from "@supabase/supabase-js";
import { AuthService } from "./auth.service";

export interface UserBound {
    user_uuid: string;
}


@Injectable({ providedIn: 'root' })
export abstract class ServiceAbstract<T> {
    private cache: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
    private useCache = true;
    protected abstract storeName: keyof MyDatabaseCollections;
    protected table!: RxCollection<T>;
    protected abstract dbService: DbService;
    protected userUuid: string | null = null;

    constructor(protected authService: AuthService) {
        this.authService.authenticatedUser.subscribe((user: User | null) => {
            if (user) {
                this.userUuid = user.id;
            }
        });
    }


    setTable() {
        this.table = this.dbService.getTable(this.storeName);
    }

    /**
     * Gets a list of items
     */
    list() {
        return this.table.find().$;
    }

    add(data: T & UserBound) {
        if (this.userUuid) {
            data["user_uuid"] = this.userUuid;
        }
        const id = crypto.randomUUID();
        return from(this.table.insert({
            id,
            ...data
        }));
    }

    bulkAdd(data: (T & UserBound)[]) {
        if (this.userUuid) {
            data = data.map((item) => {
                const user = { user_uuid: this.userUuid } as UserBound;
                return { 
                    ...item, 
                    ...user,
                    id: crypto.randomUUID() 
                };
            });
        }
        this.clearCache();
        return from(this.table.bulkInsert(data));
    }

    edit(id: number, data: T & UserBound) {
        if (this.userUuid) {
            data["user_uuid"] = this.userUuid;
        }
        this.clearCache();
        return from(this.table.findOne(`id=${id}`).update({
            $set: data
        }));
    }

    get(id: number) {
        return this.table.findOne(`id=${id}`).$;
    }

    getByField(field: keyof T, value: any): Observable<T[]> {
        return this.table.find({
            selector: {
                [field]: {
                    $eq: value
                }
            } as any
        }).$;
    }

    count() {
        return this.table.count();
    }

    countByField<K extends keyof T>(field: K, value: T[K]) {
        return from(this.table.count({
            selector: {
                [field]: {
                    $eq: value
                }
            } as any
        }).$);
    }

    getByDate(field: string, minDate?: Date, maxDate?: Date): Observable<T[]> {
        if (!minDate && !maxDate) {
            throw new Error("You should provide at least one of minDate or maxDate parameters!");
        }
        
        let selector: any = {};
        if (minDate && maxDate) {
            selector[field] = {
                $gte: minDate.toISOString(),
                $lte: maxDate.toISOString()
            };
        } else if (minDate) {
            selector[field] = {
                $gte: minDate.toISOString()
            };
        } else {
            selector[field] = {
                $lte: maxDate!.toISOString()
            };
        }

        return this.table.find({
            selector
        }).$;
    }

    slowStringSearch(field: string, value: string) {
        return this.table.find({
            selector: {
                [field]: {
                    $regex: new RegExp(value, 'i')
                }
            } as any
        }).$;
    }

    remove(id: number): Observable<any> {
        return from(this.table.findOne(`id=${id}`).remove());
    }

    bulkRemove(ids: string[]) {
        return from(
            Promise.all(
                ids.map(id => this.table.findOne(`id=${id}`).remove())
            )
        );
    }

    clear(): Observable<any> {
        this.clearCache();
        return from(this.table.remove());
    }

    deactivateCache(): void {
        this.useCache = false;
    }

    clearCache(): void {
        this.cache = new BehaviorSubject<T[]>([]);
    }
}