import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
  } from '@tauri-apps/plugin-notification';

import { SettingsService } from '../services/settings.service';
import { SettingsDto } from '../dto/settings-dto';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CardModule,
        CheckboxModule,
        CalendarModule,
        TranslateModule,
        ReactiveFormsModule,
        ToastModule,
    ],
    providers: [
        MessageService,
    ],
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
        private settingsService: SettingsService<SettingsDto>,
        private messageService: MessageService,
        private translate: TranslateService,
    ) {}

    ngOnInit(): void {
        this.settingsService.get(1).subscribe(settings => {
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
        console.log(form);
        const settingsData: SettingsDto = {
            id: 1,
            notifications: Number(form.notifications),
            todayNotifications: Number(form.todayNotifications),
            notificationTime: form.notificationTime as unknown as Date
        };
        let settings = await firstValueFrom(this.settingsService.get(1));
        let savedData$;
        if (settings?.id) {
            savedData$ = this.settingsService.edit(1, settingsData);
        } else {
            savedData$ = this.settingsService.add(settingsData);
        }
        savedData$.subscribe({
            complete: async () => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get("Success")),
                    detail: await firstValueFrom(this.translate.get("Settings saved successfully")),
                    severity: 'success'
                });
                if (settingsData.notifications) {
                    this.userInitiatedNotification();
                }
            },
            error: async (err) => {
                this.messageService.add({
                    summary: await firstValueFrom(this.translate.get("Error")),
                    detail: await firstValueFrom(this.translate.get("Error saving settings")),
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
            let date = new Date();
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
            sendNotification({
                title: await firstValueFrom(this.translate.get('Notifications enabled')),
                largeBody: await firstValueFrom(this.translate.get(`Now you'll receive our notifications.`)),
            });
        }
    }
}
