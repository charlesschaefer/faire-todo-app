import { Injectable } from '@angular/core';
import { ServiceAbstract, UserBound } from './service.abstract';
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
            this.get(1).subscribe(_user => {
                if (_user) {
                    this.edit(_user.id, {
                        id: _user.id,
                        uuid: user?.id ?? '',
                        email: user?.email ?? '',
                        name: user?.user_metadata?.["name"] ?? '',
                        avatar_url: user?.user_metadata?.["avatar_url"] ?? '', 
                    } as UserDto & UserBound).subscribe({
                        next: (user) => {
                            console.log("UserService.constructor() -> .onAuthStateChange -> edit() -> next", user);
                        },
                        error: (error) => {
                            console.error("UserService.constructor() -> .onAuthStateChange -> edit() -> error", error);
                        },
                        complete: () => {
                            console.log("UserService.constructor() -> .onAuthStateChange -> edit() -> complete");
                            subscription.unsubscribe();
                        }
                    });
                } else {
                    this.add({
                        id: 1,
                        uuid: user?.id ?? '',
                        email: user?.email ?? '',
                        name: user?.user_metadata?.["name"] ?? '',
                        avatar_url: user?.user_metadata?.["avatar_url"] ?? '', 
                    } as UserDto & UserBound).subscribe({
                        next: (user) => {
                            console.log("UserService.constructor() -> .onAuthStateChange -> add() -> next", user);
                        },
                        error: (error) => {
                            console.error("UserService.constructor() -> .onAuthStateChange -> add() -> error", error);
                        },
                        complete: () => {
                            console.log("UserService.constructor() -> .onAuthStateChange -> add() -> complete");
                            subscription.unsubscribe();
                        }
                    });
                }
            });
        });
    }

    getByUuid(uuid: string) {
        return this.getByField('uuid', uuid);
    }
} 