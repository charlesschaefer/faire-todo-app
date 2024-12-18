import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { UserDto } from '../dto/user-dto';
import { DbService } from './db.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService extends ServiceAbstract<UserDto> {
    storeName = "user";

    constructor (
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
        console.log("UserService.constructor() -> this.authService.authenticatedUser", this.authService.authenticatedUser);
        const subscription = this.authService.authenticatedUser.subscribe(user => {
            console.log("UserService.constructor() -> .authenticatedUser.subscribe()", user);
            
        });
    }

    getByUuid(uuid: string) {
        return this.getByField('uuid', uuid);
    }
} 