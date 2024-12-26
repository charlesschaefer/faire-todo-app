import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { TestSyncAddDto, TestSyncDto } from '../dto/testsync.dto';
import { DbService } from '../../services/db.service';
import { ServiceAbstract } from '../../services/service.abstract';

@Injectable({
  providedIn: 'root'
})
export class TestSyncService extends ServiceAbstract<TestSyncDto | TestSyncAddDto> {
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