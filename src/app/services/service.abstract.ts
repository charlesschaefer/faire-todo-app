import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, from } from "rxjs";
import { liveQuery, Table } from "dexie";

import { DbService } from "./db.service";
import { User } from "@supabase/supabase-js";
import { AuthService } from "./auth.service";

export interface UserBound {
    user_uuid: string;
}


@Injectable({ providedIn: 'root' })
export abstract class ServiceAbstract<T> {
    private cache: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
    private useCache = true;
    protected abstract storeName: string;
    protected table!: Table;
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
        console.log("Construindo o table do ", this.storeName)
        this.table = this.dbService.getTable(this.storeName);
        console.log(this.table);
    }

    /**
     * Gets a cached list of accounts
     * 
     * @returns Observable<BaseDto[]>
     */
    list() {
        return from(liveQuery(() => this.table.toArray()));
    }

    /**
     * @TODO: verificar se o dexie gera o uuid automaticamente ou não
     */
    add(data: T & UserBound) {
        if (this.userUuid) {
            data["user_uuid"] = this.userUuid;
        }
        return from(this.table.add(data));
    }

    bulkAdd(data: (T & UserBound)[]) {
        if (this.userUuid) {
            data = data.map((item) => {
                const user = {user_uuid: this.userUuid} as UserBound;
                return { ...item, ...user };
            });
        }
        this.clearCache();
        return from(this.table.bulkAdd(data));
    }

    updateUserUUID() {
        if (!this.userUuid) {
            throw new Error("User UUID not present on the session");
        }
        return from(this.table.where("user_uuid").notEqual("").modify({user_uuid: this.userUuid}));
    }

    edit(uuid: string, data: T & UserBound) {
        if (this.userUuid && this.storeName !== "user") {
            data["user_uuid"] = this.userUuid;
        }
        this.clearCache();
        return from(this.table.update(uuid, data as object));/* 
            .pipe(
                map((response: T) => response),
                catchError((error: T) => throwError(error))
            ); */
    }

    get(uuid: string | number) {
        let key: string;
        if (typeof uuid == 'string') {
            key = 'uuid';
        } else {
            key = 'id';
        }
        const where = {[key]: uuid};
        return from(liveQuery(() => this.table.where(where).first()));
    }

    getByField(field: string, value: any): Observable<T[]> {
        const where: Record<string, any> = {};
        where[field] = value;
        return from(liveQuery(() => this.table.where(where).toArray()));
    }

    count() {
        return from(liveQuery(() => this.table.count()));
    }

    countByField(field: string, value: any) {
        const where: Record<string, any> = {};
        where[field] = value;
        return from(liveQuery(() => this.table.where(where).count()));
    }

    getByDate(field: string, minDate?: Date, maxDate?: Date): Observable<T[]> {
        if (!minDate && !maxDate) {
            throw new Error("You should provide at least one of minDate or maxDate parameters!");
        }
        
        let query;
        if (minDate && maxDate) {
            query = this.table.where(field).between(minDate, maxDate);
        } else if (minDate) {
            query = this.table.where(field).above(minDate);
        } else {
            query = this.table.where(field).below(maxDate);
        }
        return from(liveQuery(() => query.toArray()));
    }

    // @Todo: finalizar a busca e verificar pq está pegando apenas um item do cursor.
    slowStringSearch(field: string, value: string) {
        return from(liveQuery(() => {
            return this.table.filter((item:T) => {
                return Boolean((item[field as keyof T] as string).toLowerCase().match(value.toLowerCase()));
            }).toArray()
        }));
    }

    remove(uuid: string): Observable<any> {
        return from(this.table.delete(uuid));
    }

    bulkRemove(uuids: string[]) {
        return from(this.table.where('uuid').anyOf(uuids).delete());
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