import { Injectable } from '@angular/core';
import { ServiceAbstract } from '../services/service.abstract';
import { DbService } from '../services/db.service';
import { AuthService } from '../auth/auth.service';
import { from, map, mergeMap, of, zip } from 'rxjs';
import { SettingsAddDto, SettingsDto } from '../dto/settings-dto';
import { DataUpdatedService } from '../services/data-updated.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService extends ServiceAbstract<SettingsDto | SettingsAddDto> {
    
    storeName = "settings";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }

    override updateUserUUID() {
        if (!this.userUuid) {
            throw new Error("User UUID not present on the session");
        }

        return from(this.table.toArray()).pipe(
            mergeMap((allSettings) => {
                console.log("CurrentSettings: ", allSettings);
                if (!allSettings.length) {
                    return this.add({
                        uuid: this.userUuid as string, 
                        user_uuid: this.userUuid as string,
                        id: 1,
                        notifications: 0,
                        notificationTime: null,
                        todayNotifications: 0,
                        updated_at: new Date()
                    }).pipe(map(() => 1));
                }
                const currentSettings = allSettings[0];
                const newSettings = {...currentSettings, uuid: this.userUuid, user_uuid: this.userUuid};
                // if newSettings and currentSettings uuid are equal, then the settings already has user_uuid
                if (newSettings.uuid == currentSettings.uuid) {
                    return of(0);
                }

                // we need to remove the currentSettings and add the newSettings, with user_uuid and uuid as the same value
                return zip(
                    this.remove(currentSettings.uuid),
                    from(this.table.put(newSettings))
                ).pipe(map((results) => results[1] ? 1 : 0))
            })
        );
    }

}
