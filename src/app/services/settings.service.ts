import { Injectable } from '@angular/core';
import { ServiceAbstract, Updatable } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { firstValueFrom, forkJoin, from, map, mergeMap, of, switchAll, zip } from 'rxjs';
import { SettingsAddDto, SettingsDto } from '../dto/settings-dto';

@Injectable({
    providedIn: 'root'
})
export class SettingsService extends ServiceAbstract<SettingsDto | SettingsAddDto> {
    
    storeName = "settings";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

}
