import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { UserAddDto, UserDto } from '../dto/user-dto';
import { DbService } from './db.service';
import { AuthService } from '../auth/auth.service';
import { DataUpdatedService } from './data-updated.service';

@Injectable({
    providedIn: 'root'
})
export class UserService extends ServiceAbstract<UserDto | UserAddDto> {
    storeName = "user";

    constructor (
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

    getByUuid(uuid: string) {
        return this.getByField('uuid', uuid);
    }
} 