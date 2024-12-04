import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { UserDto } from '../dto/user-dto';
import { DbService } from './db.service';

@Injectable({
    providedIn: 'root'
})
export class UserService extends ServiceAbstract<UserDto> {
    storeName = "user";

    constructor(
        protected dbService: DbService
    ) {
        super();
        this.setTable();
    }

    getByUuid(uuid: string) {
        return this.getByField('uuid', uuid);
    }
} 