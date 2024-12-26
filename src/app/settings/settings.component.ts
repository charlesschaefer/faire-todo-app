import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import {
    isPermissionGranted,
    requestPermission,
  } from '@tauri-apps/plugin-notification';

import { v4 } from 'uuid';

let randomUUID: any;
// if (!crypto.randomUUID) {
    randomUUID = v4;
// } else {
//     randomUUID = crypto.randomUUID;
// }

import { SettingsService } from './settings.service';
import { SettingsDto } from '../dto/settings-dto';
import { invoke } from '@tauri-apps/api/core';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CardModule,
        CheckboxModule,
        CalendarModule,
        TranslocoModule,
        ReactiveFormsModule,
        ToastModule,
    ],
    providers: [],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    fb = inject(FormBuilder);
    settingsForm = this.fb.group({
        notifications: new FormControl(false),
        todayNotifications: new FormControl(false),
        notificationTime: new FormControl()
    });

    constructor(
        private settingsService: SettingsService,
        private messageService: MessageService,
        private translate: TranslocoService,
    ) {}

    ngOnInit(): void {
        this.settingsService.get(1).then(settings => {
            this.settingsForm.patchValue({
                notifications: settings?.notifications ? true : false,
                todayNotifications: settings?.todayNotifications ? true : false,
                notificationTime: settings?.notificationTime || null
            });
            console.log("Settings", settings, "form", this.settingsForm.value)
        })
    }

    async saveSettings() {
        const form = this.settingsForm.value;
        const settingsData: SettingsDto = {
            id: 1,
            notifications: Number(form.notifications),
            todayNotifications: Number(form.todayNotifications),
            notificationTime: form.notificationTime as unknown as Date,
            uuid: randomUUID(),
            user_uuid: ''
        };
        const settings = await this.settingsService.get(1);
        let savedData$;
        if (settings?.uuid) {
            savedData$ = this.settingsService.edit(settings.uuid, settingsData);
        } else {
            savedData$ = this.settingsService.add(settingsData);
        }
        savedData$.subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate("Success")),
                    detail: await firstValueFrom(this.translate.selectTranslate("Settings saved successfully")),
                    severity: 'success'
                });
                if (settingsData.notifications) {
                    this.userInitiatedNotification();
                }
            },
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.selectTranslate("Error")),
                    detail: await firstValueFrom(this.translate.selectTranslate("Error saving settings")),
                    severity: 'error'
                });
            }
        });
    }

    todayNotificationsChanged() {
        if (!this.settingsForm.value.todayNotifications) {
            this.settingsForm.patchValue({
                notificationTime: null
            });
        } else {
            const date = new Date();
            date.setHours(9);
            date.setMinutes(0);

            this.settingsForm.patchValue({
                notificationTime: date,
                notifications: true
            });
        }
    }

    receiveNotificationChanged() {
        if (!this.settingsForm.value.notifications) {
            this.settingsForm.patchValue({
                notificationTime: null,
                todayNotifications: false,
            })
        }
    }

    async userInitiatedNotification() {
        // Do you have permission to send a notification?
        let permissionGranted = await isPermissionGranted();

        // If not we need to request it
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        // Once permission has been granted we can send the notification
        if (permissionGranted) {
            const title = await firstValueFrom(this.translate.selectTranslate('Notifications enabled'));
            const largeBody = await firstValueFrom(this.translate.selectTranslate(`Now you'll receive our notifications.`));
            // sendNotification({
            //     title: title,
            //     largeBody: largeBody,
            // });
            invoke('add_notification', {title, body: largeBody});
        }
    }
}
