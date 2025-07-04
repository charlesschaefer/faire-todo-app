import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import {
    isPermissionGranted,
    requestPermission,
} from '@tauri-apps/plugin-notification';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { v4 } from 'uuid';


import { SettingsDto } from '../dto/settings-dto';
import { DataUpdatedService } from '../db/data-updated.service';
import { SettingsService } from './settings.service';
import { isMobile } from '../../utils/functions';

const randomUUID: any = v4;

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
        ButtonModule
    ],
    providers: [],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
    fb = inject(FormBuilder);
    settingsForm = this.fb.group({
        notifications: new FormControl(false),
        todayNotifications: new FormControl(false),
        notificationTime: new FormControl(),
        autostart: new FormControl(false)
    });

    isMobile: boolean = isMobile();

    settingsSubscription?: Subscription;

    constructor(
        private settingsService: SettingsService,
        private messageService: MessageService,
        private translate: TranslocoService,
        private dataUpdatedService: DataUpdatedService,
    ) {}

    ngOnInit(): void {
        this.loadSettings();

        this.settingsSubscription = this.dataUpdatedService?.subscribe('settings', () => {
            this.loadSettings();
        });
    }

    ngOnDestroy(): void {
        this.settingsSubscription?.unsubscribe();
    }

    loadSettings() {
        this.settingsService.get(1).then(settings => {
            this.settingsForm.patchValue({
                notifications: settings?.notifications ? true : false,
                todayNotifications: settings?.todayNotifications ? true : false,
                notificationTime: settings?.notificationTime || null,
                autostart: settings?.autostart ? true : false
            });
            //console.log("Settings", settings, "form", this.settingsForm.value)
        });
    }

    async saveSettings() {
        const form = this.settingsForm.value;
        const settingsData: SettingsDto = {
            id: 1,
            notifications: Number(form.notifications),
            todayNotifications: Number(form.todayNotifications),
            notificationTime: form.notificationTime as unknown as Date,
            uuid: randomUUID(),
            user_uuid: '',
            autostart: Number(form.autostart),
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
                    summary: this.translate.translate("Success"),
                    detail: this.translate.translate("Settings saved successfully"),
                    severity: 'success'
                });
                if (settingsData.notifications) {
                    this.userInitiatedNotification();
                }

                if (settingsData.autostart) {
                    invoke('set_autostart', {enable: true});
                } else {
                    invoke('set_autostart', {enable: false});
                }
            },
            error: async () => {
                this.messageService.add({
                    summary: this.translate.translate("Error"),
                    detail: this.translate.translate("Error saving settings"),
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
            const title = this.translate.translate('Notifications enabled');
            const largeBody = this.translate.translate(`Now you'll receive our notifications.`);
            // sendNotification({
            //     title: title,
            //     largeBody: largeBody,
            // });
            invoke('add_notification', {title, body: largeBody});
        }
    }
}
