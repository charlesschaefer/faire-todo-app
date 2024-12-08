import { Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TestSyncDto } from '../dto/testsync.dto';
import { DbService } from '../../services/db.service';
import { ServiceAbstract } from '../../services/service.abstract';
import { MyDatabaseCollections } from '../../app.rxdb';

@Injectable({
  providedIn: 'root'
})
export class TestSyncService<T> extends ServiceAbstract<TestSyncDto> {
    storeName = "testsync" as keyof MyDatabaseCollections;


    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
        this.authService.authenticatedUser.subscribe((user) => {
            if (user) {
                this.userUuid = user.id;
            }
        });
    }
}