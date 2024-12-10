import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, from } from "rxjs";
import { liveQuery, Table } from "dexie";
import { RxCollection, RxDocument } from 'rxdb';

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
    protected _table!: RxCollection<T>;
    protected abstract dbService: DbService;
    protected userUuid: string | null = null;

    constructor(protected authService: AuthService) {
        this.authService.authenticatedUser.subscribe((user: User | null) => {
            if (user) {
                this.userUuid = user.id;
            }
        });
    }

    get table(): RxCollection<T> {
        if (!this._table) {
            const that = this;
            const proxyCallers = new Proxy({}, {
                get(target, prop) {
                    if (that._table && prop in that._table) {
                        return that._table[prop as keyof typeof that._table];
                    }
                    const $ = new Subject<any>();
                    that.dbService.getTable(that.storeName).then((table: RxCollection) => {
                        if (!table) {
                            return that.dbService.getTable(that.storeName).then((_table: RxCollection) => {
                                that._table = _table;
                                const result = that._table[prop as keyof typeof that._table]();
                                $.next(result);
                                $.complete(); 
                                return _table;
                            });
                        }
                        that._table = table;
                        const result = that._table[prop as keyof typeof that._table]();
                        $.next(result);
                        $.complete();
                        return table;
                    });
                    return () => {
                        console.log("Calling ", prop);
                        return { $: $ }
                    };
                }
            });
            return proxyCallers as RxCollection<T>;
        }
        return this._table;
    }

    setTable() {
        return this.dbService.getTable(this.storeName).then((table: RxCollection) => {
            this._table = table;
            return table;
        });
    }

    /**
     * Gets a list of items
     */
    list() {
        const result = this.table.find();
        return result.$;
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

    getByField(field: keyof T, value: any) {
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

    getByDate(field: string, minDate?: Date, maxDate?: Date) {
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

    bulkRemove(ids: number[]) {
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