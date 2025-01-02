import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { ThemeService } from '../services/theme.service';
import { ProjectService } from '../project/project.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { DataUpdatedService } from '../services/data-updated.service';
import { firstValueFrom } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SyncService } from '../services/sync.service';
import { invoke } from '@tauri-apps/api/core';
import { SidebarModule } from 'primeng/sidebar';
import { AuthComponent } from '../auth/auth.component';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PrimeNG } from 'primeng/config';


@Component({
    selector: 'app-sidemenu',
    standalone: true,
    imports: [
        AuthComponent,
        DrawerModule,
        AvatarModule,
        SidebarModule,
        TranslocoModule,
        MenuModule,
        CommonModule,
        ButtonModule
    ],
    providers: [provideTranslocoScope('primeng')],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sidemenu.component.html',
    styleUrl: './sidemenu.component.scss'
})
export class SidemenuComponent implements OnInit {

    @Input() syncStatus = '';
    
    private _showSidebar = false;
    @Output() showSidebarChange = new EventEmitter();

    menuItems!: MenuItem[];
    settingsMenuItems!: MenuItem[];

    @Input() currentUser: User | null = null;

    @ViewChild(AuthComponent) authComponent?: AuthComponent;
    
    constructor(
        private themeService: ThemeService,
        private translate: TranslocoService,
        private primeNGConfig: PrimeNG,
        private projectService: ProjectService,
        private router: Router,
        public authService: AuthService,
        private syncService: SyncService,
        private dataUpdatedService: DataUpdatedService,
    ) { }

    @Input() 
    get showSidebar() {
        return this._showSidebar;
    }
    set showSidebar(value: boolean) {
        this._showSidebar = value;
        this.showSidebarChange.emit(value);
    }
    ngOnInit(): void {
        this.setupMenu();

        this.applyUserTheme();

        this.handleDataUpdates();

        this.updatePrimeNGTranslations();
    }

    showLoginDialog() {
        this.authComponent?.showLoginDialog();
    }


    async setMenuItems(additionalItems: MenuItem[]) {
        const menuItems: MenuItem[] = [{
            label: " ",
            items: [
                { label: await firstValueFrom(this.translate.selectTranslate("Inbox")), icon: 'pi pi-inbox', routerLink: '/inbox' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Today`)), icon: 'pi pi-calendar', routerLink: '/today' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Upcoming`)), icon: 'pi pi-clock', routerLink: '/upcoming' } as MenuItem,
                { label: await firstValueFrom(this.translate.selectTranslate(`Projects`)), icon: 'pi pi-clipboard', routerLink: '/project', badge: additionalItems[1]?.items?.length } as MenuItem,
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
                label: await firstValueFrom(this.translate.selectTranslate("Synchronize")),
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
                        command: () => this.switchLanguage('pt-br')
                    }
                ]
            } as MenuItem
        ];
        if (this.currentUser && this.currentUser.id) {
            this.settingsMenuItems.push({
                label: await firstValueFrom(this.translate.selectTranslate("Synchronization")),
                icon: "pi pi-sync",
                items: [
                    {
                        label: await firstValueFrom(this.translate.selectTranslate("Repair synchronization status")),
                        command: () => this.syncService.fixSynchronization()
                    }
                ]
            })
        }
    }

    async getProjectMenuItems(): Promise<MenuItem[]> {
        const projects = await this.projectService.list()
        if (!projects.length) return [];
        const projectItems: MenuItem[] = [];
        for (const project of projects) {
            projectItems.push({
                label: project.name,
                icon: 'pi pi-hashtag',
                routerLink: `/project/${project.uuid}/tasks`,
                styleClass: 'project-menu-item'
            });
        }
        const projectMenuItems = {
            label: await firstValueFrom(this.translate.selectTranslate("Projects")),
            items: projectItems,
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

    switchTheme() {
        this.themeService.switchTheme();

        const currentTheme = this.themeService.getCurrentTheme();
        localStorage.setItem('theme', currentTheme);
    }

    switchLanguage(language: 'en' | 'pt-br') {
        
        const availableLangs: any[] = this.translate.getAvailableLangs();
        
        if (!language || !availableLangs.includes(language)) {
            console.warn(`Language ${language} unavailable. Using 'en' as fallback.`);
            language = 'en';
        }
        
        console.log("Changing language to ", language);

        this.translate.setActiveLang(language);
        localStorage.setItem('language', language);
        this.setupMenu();

        this.updatePrimeNGTranslations();
    }

    updatePrimeNGTranslations() {
        const lang = this.translate.getActiveLang();
        this.translate.selectTranslateObject(lang, {}, 'primeng/' + lang).subscribe(primeNGTranslations => {
            this.primeNGConfig.setTranslation(primeNGTranslations)
        });
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
            await this.authService.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    private applyUserTheme() {
        const currentTheme = this.themeService.getCurrentTheme();
        let userTheme = localStorage.getItem('theme');
        if (!userTheme) {
            userTheme = currentTheme;
        }
        if (userTheme != currentTheme) {
            this.themeService.switchTheme(userTheme);
        }
    }


    private handleDataUpdates() {
        this.dataUpdatedService.subscribe('project', (_changes) => {
            console.warn("Novo projeto entrando... vamos atualizar o menu");
            this.setupMenu();
        });
    }
}
