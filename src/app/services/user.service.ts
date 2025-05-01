import { Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { UserAddDto, UserDto } from '../dto/user-dto';
import { DataUpdatedService } from './data-updated.service';
import { DbService } from './db.service';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class UserService extends ServiceAbstract<UserDto | UserAddDto> {
    storeName = "user";

    constructor (
        protected dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }

    getByUuid(uuid: string) {
        return this.getByField('uuid', uuid);
    }
} 
