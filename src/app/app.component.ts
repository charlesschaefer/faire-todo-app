import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, HostListener, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { User } from '@supabase/supabase-js';
import { invoke, PluginListener } from '@tauri-apps/api/core';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';
import { platform } from '@tauri-apps/plugin-os';
import { Dexie } from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { delay, firstValueFrom, Subscription } from 'rxjs';
import { type ShareEvent, listenForShareEvents } from 'tauri-plugin-sharetarget-api';

import { AuthService } from './auth/auth.service';
import { SettingsAddDto, SettingsDto } from './dto/settings-dto';
import { TaskDto } from './dto/task-dto';
import { InboxComponent } from './inbox/inbox.component';
import { NotificationService } from './services/notification.service';
import { SyncService } from './db/sync.service';
import { UndoService } from './services/undo.service';
import { SettingsService } from './settings/settings.service';
import { SidemenuComponent } from "./sidemenu/sidemenu.component";
import { TaskService } from './task/task.service';
import { VersionComponent } from './version/version.component';
import { KeyboardShortcutsComponent } from './keyboard-shortcuts/keyboard-shortcuts.component';
import { KeyboardShortcutService, Shortcut } from './services/keyboard-shortcut.service';
import { OnboardingComponent } from "./onboarding/onboarding.component";
import { ThemeService } from './services/theme.service';

export const TAURI_BACKEND = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';
export enum NotificationType {
    DueTask,
    TodayTasks
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
    CommonModule,
    RouterOutlet,
    ToolbarModule,
    ButtonModule,
    MenuModule,
    ToastModule,
    TranslocoModule,
    DialogModule,
    CheckboxModule,
    FormsModule,
    MessageModule,
    RouterLink,
    SidemenuComponent,
    VersionComponent,
    KeyboardShortcutsComponent,
    OnboardingComponent
],
    providers: [
        MessageService
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    showSidebar = false;
    showShortcuts = false;

    syncStatus = '';
    _currentUser = signal<User | null>(null);
    currentUser = computed<User | null>(() => this._currentUser());

    shareListener!: PluginListener;
    childComponentsData!: {
        showAddTask: boolean,
        sharetargetUrl: string,
    };
    showAddTaskSubscription!: Subscription;

    constructor(
        private translate: TranslocoService,
        private undoService: UndoService,
        private messageService: MessageService,
        private taskService: TaskService,
        private httpClient: HttpClient,
        private settingsService: SettingsService,
        private notificationService: NotificationService,
        private router: Router,
        private syncService: SyncService,
        public authService: AuthService,
        private keyboardShortcutService: KeyboardShortcutService,
        private themeService: ThemeService,

    ) {
        translate.setDefaultLang('en');
        //translate.setActiveLang('en');
        console.warn("AppComponent::Constructor()")

        let userLanguage = localStorage.getItem('language');
        const availableLangs: any[] = this.translate.getAvailableLangs();

        if (!userLanguage || !availableLangs.includes(userLanguage)) {
            userLanguage = 'en';
        }
        this.translate.setActiveLang(userLanguage);

        if (TAURI_BACKEND) { // && platform() == 'android') {
            onOpenUrl((urls) => {
                console.log("Urls: ", urls)
                if (urls) {
                    let index;
                    this.router.navigate(["/auth"])
                    setTimeout(() => {
                        if ((index = urls[0].indexOf('#')) !== -1) {
                            const fragment = urls[0].slice(index + 1);
                            this.router.navigate(['/auth/callback'], { fragment: fragment })
                            return;
                        }
                    }, 2000);
                    // window.location.assign(urls[0]);
                }
            });
        }
    }


    /**
     * If we received a sharetarget intent event, we detect when the router-outlet activates a component
     * that is or extends InboxComponent, and subscribe to the event to open and close the task add overlay.
     * 
     */
    onActivate(component: any) {
        // close the sidebar everytime we activate a new view
        this.showSidebar = false;

        const url = this.router.url;
        let index: number;
        if ((index = url.indexOf('#afterAuth')) !== -1 && component instanceof InboxComponent) {
            // if we just arrived from an authentication, the tasks table will be filled after we alrady rendered the component
            // so we wait for 2 seconds and ask the component to load the tasks from the table again.
            setTimeout(() => {
                component.getTasks()
            }, 2000);
        }

        if (this.childComponentsData?.showAddTask) {
            if (component instanceof InboxComponent) {
                component.sharetargetUrl = this.childComponentsData.sharetargetUrl;
                this.showAddTaskSubscription = component.showTaskAddOverlay$.subscribe(ev => {
                    console.log("Limpando o childComponentsData", !ev?.target);
                    if (!ev?.target) {
                        this.childComponentsData = {
                            showAddTask: false,
                            sharetargetUrl: '',
                        };
                        this.showAddTaskSubscription.unsubscribe();
                    }
                });
            }
        }
    }

    ngOnInit() {
        //invoke("set_frontend_complete");

        this.handleUserAuthenticationState();

        this.watchForUndoCalls();

        this.settingsService.get(1).then(async (settings: SettingsDto | SettingsAddDto) => {
            void (TAURI_BACKEND && this.notificationService.setup(settings as SettingsDto));
        });

        this.listenForShareEvents();

        this.handleShortcutsKey();
    }

    undo(_event: any) {
        this.undoService.undo();
    }

    async notifyDuingTask(task: TaskDto) {
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
                title: this.translate.translate('Task duing'),
                largeBody: this.translate.translate(`The task "{{title}}" is dueing now.`, { title: task.title })
            });
        }
    }

    async notifyTasksDuingToday() {
        // Do you have permission to send a notification?
        let permissionGranted = await isPermissionGranted();

        // If not we need to request it
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        // Once permission has been granted we can send the notification
        if (permissionGranted) {
            const duingToday = await firstValueFrom(this.taskService.countForToday());
            sendNotification({
                title: this.translate.translate('Tasks duing today'),
                largeBody: this.translate.translate(`You have {{total}} tasks duing today.`, { total: duingToday })
            });
        }
    }

    startSynchronizationAsClient() {
        invoke('search_network_sync_services').then(host => {
            alert(`Máquina descoberta: ${host}`);
            console.log("Vamos chamar o servidor http");
            this.httpClient.post(`http://${host}:9099/handshake`, {}, {
                headers: {
                    'X-SIGNED-TOKEN': 'ABC123ABC123'
                }
            }).subscribe(results => {
                console.log("Result received from server: ", results);
            })
        })
    }

    startSynchronizationAsServer() {
        invoke('broadcast_network_sync_services').then(() => {
            invoke('start_http_server');
        })
    }

    private async handleUserAuthenticationState() {
        this.authService.user.subscribe(async user => {
            if (this._currentUser() && !user) {
                this._currentUser.set(null);

                console.log("User signed out... disconnecting synchronization")
                return this.syncService.disconnect().catch(console.error).then(async () => {
                    this.messageService.add({
                        severity: 'info',
                        summary: this.translate.translate("Signed off"),
                        detail: this.translate.translate("You were signed off. Now your tasks will be saved only locally."),
                        key: 'auth-messages'
                    })
                });
            }

            if (!user && !this._currentUser()) {
                console.error("Unknown user authentication state...")
                return;
            }

            if (this._currentUser() && user) {
                console.log("authService.user.next() sent the same user again... we won't call the sync service")
                return;
            }

            console.log("User signed in... connecting synchronization")

            this._currentUser.set(user);

            this.messageService.add({
                severity: 'info',
                detail: this.translate.translate("We will start synchronizing your data with our servers now"),
                summary: this.translate.translate("Starting synchronization"),
                key: 'auth-messages'
            });


            // start watching for changes on the synchronization status
            this.syncService.syncStatus.subscribe((status) => {
                this.syncStatus = Dexie.Syncable.StatusTexts[status];
                console.warn("Synchronization new status: ", this.syncStatus)
            });

            try {
                this.linkUserDataAndSynchronize();
            } catch (error) {
                this.messageService.add({
                    severity: 'warning',
                    detail: this.translate.translate("We couldn't stabilsh a connection with our synchronization servers. We're going to try again."),
                    summary: this.translate.translate("Failed to synchronize with server."),
                    key: 'auth-messages'
                });

                console.log("Error starting synchronization: ", error);
                console.log("Trying to connect synchronization again")
                await this.syncService.disconnect();
                await this.syncService.connect().catch(console.error)
            }
        });
    }

    linkUserDataAndSynchronize() {
        // @TODO: checar todas as linhas que não têm user_uuid, para saber se temos que chamar isso agora.
        // updates all tasks, projects, tags, settings and task_tags with the current user.uuid
        // before starting the sincronization
        this.syncService.updateRowsUserUuid().subscribe({
            next: async changed => {
                const { userUpserted, ...changedItems } = { ...changed };

                if (Object.values(changedItems).filter(count => count > 0).length > 0) {
                    this.messageService.add({
                        severity: 'success',
                        detail: this.translate.translate("Your data was successfully linked to your Google User."),
                        summary: this.translate.translate("Linking your data to your Google User"),
                        key: 'auth-messages'
                    });
                }

                console.log("======> Changed itens: ");
                console.info("taskChanged: ", changed.taskChanged);
                console.info("tagChanged: ", changed.tagChanged);
                console.info("taskTagChanged: ", changed.taskTagChanged);
                console.info("settingsChanged: ", changed.settingsChanged);
                console.info("projectChanged: ", changed.projectChanged);
                console.info("taskAttachmentChanged: ", changed.taskAttachmentChanged);

                await this.syncService.connect().catch(console.error);
            },
            error: async (error) => {
                console.log("AppComponent:linkUserDataAndSynchronize() -> Error updating table rows' user_uuid: ", error);
                await this.syncService.disconnect();
                this.linkUserDataAndSynchronize();
            }
        });
    }

    showSidebarOnSwipe() {
        this.showSidebar = true;

        console.log("showSidebar: ", this.showSidebar);

        return true;
    }

    private watchForUndoCalls() {
        // watches for undo calls, so we exhibit a toast to the user
        this.undoService.watch().pipe(delay(700)).subscribe(async () => {
            // exhibits the toast with a link to the undo() method
            this.messageService.add({
                severity: 'contrast',
                summary: this.translate.translate('Undo'),
                detail: this.translate.translate('Action completed.'),
                life: 15000
            });
        });
    }

    private listenForShareEvents() {
        if (!TAURI_BACKEND || platform() !== "android") return;
        listenForShareEvents((intent: ShareEvent) => {
            if (intent.uri) {
                const uri = parseIntentUri(intent.uri);
                const url = decodeURIComponent(uri['S.android.intent.extra.TEXT']);

                this.childComponentsData = {
                    showAddTask: true,
                    sharetargetUrl: url,
                };

                // alert(`AppComponent.ngOnInit() ${url}`);
                console.log("AppComponent.ngOnInit() =====>>>>>", url);
                if (this.router.url.indexOf('today') !== -1) {
                    this.router.navigate(['/inbox']);
                } else {
                    this.router.navigate(['/today']);
                }
            }
        }).then(listener => {
            this.shareListener = listener;
        });
    }

    handleShortcutsKey() {
        const shortcuts: Shortcut[] = [
            {
                key: 'Shift+?',
                handler: () => {
                    this.showShortcuts = true;
                },
                description: this.translate.translate('Show Shortcuts')
            },
            {
                key: 'I',
                handler: () => {
                    this.router.navigate(['/inbox']);
                },
                description: this.translate.translate('Go to Inbox')
            },
            {
                key: 'T',
                handler: () => {
                    this.router.navigate(['/today']);
                },
                description: this.translate.translate('Go to Today')
            },
            {
                key: 'U',
                handler: () => {
                    this.router.navigate(['/upcoming']);
                },
                description: this.translate.translate('Go to Upcoming')
            },
            {
                key: 'P',
                handler: () => {
                    this.router.navigate(['/project']);
                },
                description: this.translate.translate('Go to Projects')
            },
            {
                key: 'A',
                handler: () => {
                    this.router.navigate(['/all-tasks']);
                },
                description: this.translate.translate('Go to All Tasks')
            },
            {
                key: '/',
                handler: () => {
                    this.router.navigate(['/search']);
                },
                description: this.translate.translate('Go to Search')
            }

        ];
        // Register the shortcuts
        this.keyboardShortcutService.setShortcuts(shortcuts);
    }

    @HostListener('window:keydown', ['$event'])
    setupShortcut(event: KeyboardEvent) {
        this.keyboardShortcutService.handleKeydown(event);
    }

    isInputFocused(): boolean {
        const active = document.activeElement;
        if (!active) return false;
        const tag = active.tagName.toLowerCase();
        return (
            tag === 'input' ||
            tag === 'textarea' ||
            (active as HTMLElement).isContentEditable
        );
    }

    closeShortcuts() {
        this.showShortcuts = false;
    }

}


function parseIntentUri(uri: string) {
    uri = uri.replace(/^#Intent;/, '').replace(/;end$/, '');
    const parts = uri.split(';');
    const result: Record<string, string> = {};
    for (const part of parts) {
        const [key, value] = part.split('=');
        result[key] = value;
    }
    return result;
}
