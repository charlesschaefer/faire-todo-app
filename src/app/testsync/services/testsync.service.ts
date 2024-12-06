import { Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TestSyncDto, TestSyncAddDto } from '../dto/testsync.dto';
import { BehaviorSubject, Observable } from 'rxjs';
import { DbService } from '../../services/db.service';
import { ServiceAbstract } from '../../services/service.abstract';

@Injectable({
  providedIn: 'root'
})
export class TestSyncService<T> extends ServiceAbstract<TestSyncDto> {
    storeName = "testsync";


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