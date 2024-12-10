import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { SidebarModule } from 'primeng/sidebar';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';
} from '@tauri-apps/plugin-notification';
import { listen } from '@tauri-apps/api/event';
import { AvatarModule } from 'primeng/avatar';
import { listenForShareEvents, type ShareEvent } from 'tauri-plugin-sharetarget-api';
import { Router } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { UndoService } from './services/undo.service';
import { ProjectService } from './services/project.service';
import { ProjectDto } from './dto/project-dto';
import { TaskDto } from './dto/task-dto';
import { TaskService } from './services/task.service';
import { invoke, PluginListener } from '@tauri-apps/api/core';
import { HttpClient } from '@angular/common/http';
import { SettingsService } from './services/settings.service';
import { SettingsDto } from './dto/settings-dto';
import { NotificationService } from './services/notification.service';
import { AuthComponent } from './auth/auth.component';
import { SyncService } from './services/sync.service';
import Dexie from 'dexie';
import { AuthService } from './services/auth.service';
import { InboxComponent } from './inbox/inbox.component';

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
        SidebarModule,
        AvatarModule,
        DialogModule,
        CheckboxModule,
        FormsModule,
        MessageModule,
        AuthComponent,
    ],
    providers: [
        MessageService,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    showSidebar = false;

    menuItems!: MenuItem[];
    settingsMenuItems!: MenuItem[];

    syncStatus: string = '';
    currentUser: User | null = null;
    
    shareListener!: PluginListener;
    childComponentsData!: {
        showAddTask: boolean,
        sharetargetUrl: string,
    };
    showAddTaskSubscription!: Subscription;

    constructor (
        private themeService: ThemeService,
        private translate: TranslocoService,
        private undoService: UndoService,
        private messageService: MessageService,
        private projectService: ProjectService<ProjectDto>,
        private taskService: TaskService<TaskDto>,
        private httpClient: HttpClient,
        private settingsService: SettingsService<SettingsDto>,
        private notificationService: NotificationService,
        private router: Router,
        private syncService: SyncService,
        public authService: AuthService,
    ) {
        translate.setDefaultLang('en');
        //translate.setActiveLang('en');


        let userLanguage = localStorage.getItem('language');
        if (!userLanguage) {
            userLanguage = 'en';
        }
        this.translate.setActiveLang(userLanguage);

        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;
            if (user) {
                this.setupMenu();
            }
        });

        // Subscribe to sync status changes
        this.syncService.syncStatus.subscribe(status => {
            this.syncStatus = Dexie.Syncable.StatusTexts[status];
        });

        // Subscribe to auth changes
        this.authService.user.subscribe(user => {
            if (user) {
                this.syncService.connect().catch(console.error);
            } else {
                this.syncService.disconnect().catch(console.error);
            }
        });
    }

    async setMenuItems(additionalItems: MenuItem[]) {
        const menuItems: MenuItem[] = [{
            label: " ",
            items: [
                { label: await firstValueFrom(this.translate.selectTranslate("Inbox")), icon: 'pi pi-inbox', routerLink: '/inbox' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Today`)), icon: 'pi pi-calendar', routerLink: '/today' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Upcoming`)), icon: 'pi pi-clock', routerLink: '/upcoming' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Projects`)), icon: 'pi pi-clipboard', routerLink: '/project' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`All Tasks`)), icon: 'pi pi-asterisk', routerLink: '/all-tasks' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Search`)), icon: 'pi pi-search', routerLink: '/search' } as MenuItem,
                { separator: true },
                { label: await firstValueFrom(this.translate.selectTranslate(`Close App`)), icon: 'pi pi-times', command: () => invoke("close_app") } as MenuItem,
            ],
        }];
        for (const item of additionalItems) {
            menuItems.push(item);
        }

        this.menuItems = menuItems;

        this.settingsMenuItems = [
            {
                label: await firstValueFrom(this.translate.selectTranslate("Settings")),
                items: [
                    { label: await firstValueFrom(this.translate.selectTranslate("User Settings")), routerLink: '/settings' } as MenuItem,
                ]
            },
            {
                lable: await firstValueFrom(this.translate.selectTranslate("Synchronize")),
                items: [
                    {
                        label: await firstValueFrom(this.translate.selectTranslate("Synchronize other devices")),
                        routerLink: '/sync'
                    } as MenuItem
                ]
            },
            {
                label: await firstValueFrom(this.translate.selectTranslate("Theme")),
                items: [
                    { label: await firstValueFrom(this.translate.selectTranslate("Change Theme")), command: () => this.switchTheme(), icon: "pi pi-moon" } as MenuItem,
                ],
            },
            {
                label: await firstValueFrom(this.translate.selectTranslate("Language")),
                icon: "pi pi-flag",
                items: [
                    {
                        label: await firstValueFrom(this.translate.selectTranslate("English")),
                        command: () => this.switchLanguage('en')
                    },
                    {
                        label: await firstValueFrom(this.translate.selectTranslate("Portuguese")),
                        command: () => this.switchLanguage('pt-BR')
                    }
                ]
            } as MenuItem
        ];
    }

    async getProjectMenuItems(): Promise<MenuItem[]> {
        const projects = await firstValueFrom(this.projectService.list())
        if (!projects.length) return [];
        const projectItems: MenuItem[] = [];
        for (const project of projects) {
            projectItems.push({
                label: project.name,
                icon: 'pi pi-hashtag',
                routerLink: `/project/${project.id}/tasks`
            });
        }
        let projectMenuItems = {
            label: await firstValueFrom(this.translate.selectTranslate("Projects")),
            items: projectItems
        };

        return [
            { separator: true },
            projectMenuItems,
        ];
    }

    async setupMenu() {
        const projectItems = await this.getProjectMenuItems();
        await this.setMenuItems(projectItems);
    }

    /**
     * If we received a sharetarget intent event, we detect when the router-outlet activates a component
     * that is or extends InboxComponent, and subscribe to the event to open and close the task add overlay.
     * 
     */
    onActivate(component: any) {
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

        this.setupMenu();

        const currentTheme = this.themeService.getCurrentTheme();
        let userTheme = localStorage.getItem('theme');
        if (!userTheme) {
            userTheme = currentTheme;
        }
        if (userTheme != currentTheme) {
            this.themeService.switchTheme(userTheme);
        }

        // watches for undo calls, so we exhibit a toast to the user
        this.undoService.watch().subscribe(() => {
            // exhibits the toast with a link to the undo() method
            this.messageService.add({
                severity: 'info',
                summary: 'Undo',
                detail: 'Action completed.',
                life: 15000
            });
        });

        this.settingsService.get(1).subscribe(async (settings: SettingsDto) => {
            this.notificationService.setup(settings);
        });

        this.settingsService.get(1).subscribe(async (settings: SettingsDto) => {
            this.notificationService.setup(settings);
        });

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

        // this.childComponentsData = {
        //     showAddTask: true,
        //     sharetargetUrl: "http://localhost:4200/inbox",
        // };
        // console.log("AppComponent.ngOnInit()", this.childComponentsData);

        // // starts the notification worker
        // if (typeof Worker !== 'undefined') {
        //     // Create a new
        //     const worker = new Worker(new URL('./app.worker', import.meta.url));
        //     worker.onmessage = ({ data }) => {
        //         if (data.type == NotificationType.DueTask) {
        //             this.notifyDuingTask(data.task);
        //         } else if (data.type == NotificationType.TodayTasks) {
        //             this.notifyTasksDuingToday();
        //         }
        //     };
        //     worker.postMessage('hello');
        // } else {
        //     // Web Workers are not supported in this environment.
        //     // You should add a fallback so that your program still executes correctly.
        //     alert("Web Workers are not supported in this environment.");
        // }
    }

    switchTheme() {
        this.themeService.switchTheme();

        const currentTheme = this.themeService.getCurrentTheme();
        localStorage.setItem('theme', currentTheme);
    }

    switchLanguage(language: 'en' | 'pt-BR') {
        console.log("Changing language to ", language)
        this.translate.setActiveLang(language);
        localStorage.setItem('language', language);
        this.setupMenu();
    }

    undo() {
        this.messageService.clear();
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
                title: await firstValueFrom(this.translate.selectTranslate('Task duing')),
                largeBody: await firstValueFrom(this.translate.selectTranslate(`The task "{{title}}" is dueing now.`, { title: task.title }))
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
                title: await firstValueFrom(this.translate.selectTranslate('Tasks duing today')),
                largeBody: await firstValueFrom(this.translate.selectTranslate(`You have {{total}} tasks duing today.`, { total: duingToday }))
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

    async signInWithGoogle() {
        try {
            await this.authService.signInWithGoogle();
        } catch (error) {
            console.error('Error signing in:', error);
        }
    }

    async signOut() {
        try {
            await this.authService.logout();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
}


function parseIntentUri(uri: string) {
    uri = uri.replace(/^#Intent;/, '').replace(/;end$/, '');
    let parts = uri.split(';');
    let result: { [key: string]: string } = {};
    for (let part of parts) {
        let [key, value] = part.split('=');
        result[key] = value;
    }
    return result;
}

function checkDuedTasks() {
    const date = new Date;
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const time = new Date;

    const dbService = new DbService();
    let taskService = new TaskService<TaskDto>(dbService);
    taskService.getByField('dueDate', date).subscribe(tasks => {
        const duingTasks: {tasks: {title: string}[]} = {tasks: []};
        tasks.reduce((acc, task) => {
            if (task.dueTime?.getHours() == time.getHours() && task.dueTime?.getMinutes() == time.getMinutes()) {
                console.log(`We need to notify user that ${task.title} task is duing now`);
                // task dueing now, notifying the user
                acc.tasks.push({title: task.title});
            }
            return acc;
        }, duingTasks);
        invoke('set_due_tasks', duingTasks);
    })
}