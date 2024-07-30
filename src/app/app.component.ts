import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { SidebarModule } from 'primeng/sidebar';


import { ThemeService } from './services/theme.service';
import { routes } from './app.routes';
import { UndoService, UndoItem } from './services/undo.service';
import { ProjectService } from './services/project.service';
import { ProjectDto } from './dto/project-dto';

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
        TranslateModule,
        SidebarModule,
    ],
    providers: [
        MessageService,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    showSidebar: boolean = false;

    menuItems!: MenuItem[];
    settingsMenuItems!: MenuItem[];

    constructor(
        private themeService: ThemeService,
        private translate: TranslateService,
        private undoService: UndoService,
        private messageService: MessageService,
        private projectService: ProjectService<ProjectDto>,
    ) {
        translate.setDefaultLang('en');
        //translate.use('en');

        this.setMenuItems();
        this.setProjectMenuItems();

        let userLanguage = localStorage.getItem('language');
        if (!userLanguage) {
            userLanguage = 'en';
        }
        console.log("Definindo a língua em ", userLanguage);
        this.translate.use(userLanguage);
    }

    async setMenuItems() {
        this.menuItems = [{
            label: " ",
            items: [
                { label: await firstValueFrom(this.translate.get("Inbox")), icon: 'pi pi-inbox', routerLink: '/inbox' } as MenuItem,
                { label: await firstValueFrom(this.translate.get(`Today`)), icon: 'pi pi-calendar', routerLink: '/today' } as MenuItem,
                { label: await firstValueFrom(this.translate.get(`Upcoming`)), icon: 'pi pi-clock', routerLink: '/upcoming' } as MenuItem,
                { label: await firstValueFrom(this.translate.get(`Projects`)), icon: 'pi pi-clipboard', routerLink: '/project' } as MenuItem,
                { label: await firstValueFrom(this.translate.get(`Search`)), icon: 'pi pi-search', routerLink: '/search' } as MenuItem,
            ],
            /* , */
        }];

        this.settingsMenuItems = [
            {
                label: await firstValueFrom(this.translate.get("Theme")),
                items: [
                    { label: await firstValueFrom(this.translate.get("Change Theme")), command: () => this.switchTheme(), icon: "pi pi-moon" } as MenuItem,
                ],
            },
            { 
                label: await firstValueFrom(this.translate.get("Language")), 
                icon: "pi pi-flag",
                items: [
                    {
                        label: await firstValueFrom(this.translate.get("English")),
                        command: () => this.switchLanguage('en')
                    },
                    {
                        label: await firstValueFrom(this.translate.get("Portuguese")),
                        command: () => this.switchLanguage('pt-BR')
                    }
                ]
            } as MenuItem
        ];
    }

    async setProjectMenuItems() {
        this.projectService.list().subscribe(async (projects) => {
            console.log("Projetos: ", projects);
            if (!projects.length) return;
            let projectItems: MenuItem[] = [];
            projects.forEach((project: ProjectDto) => {
                projectItems.push({
                    label: project.name, 
                    icon: 'pi pi-hashtag',
                    routerLink: `/project/${project.id}/tasks`
                });
            });
            let projectMenuItems = {
                label: await firstValueFrom(this.translate.get("Projects")),
                items: projectItems
            };
            console.log("MenuItems", this.menuItems, "ProjectMenuItems: ", projectMenuItems);
            this.menuItems.push({separator: true});
            this.menuItems.push(projectMenuItems);
        })
    }
    
    ngOnInit(): void {
        //invoke("set_frontend_complete");

        let currentTheme = this.themeService.getCurrentTheme();
        let userTheme = localStorage.getItem('theme');
        if (!userTheme) {
            userTheme = currentTheme;
        }
        if (userTheme != currentTheme) {
            console.log(userTheme, currentTheme);
            this.themeService.switchTheme(userTheme);
        }

        // watches for undo calls, so we exhibit a toast to the user
        this.undoService.watch().subscribe(item => {
            console.log("Chegou do undo.watch()");
            // exhibits the toast with a link to the undo() method
            this.messageService.add({
                severity: 'info',
                summary: 'Undo', 
                detail: 'Action completed.',
                life: 15000
            });
        });

    }

    testeUndo() {
        let undoData:UndoItem = {
            data: {nada: 'não'},
            type: 'app.testeUndo'
        };
        this.undoService.register(undoData).subscribe((undo: UndoItem) => {
            console.log("register.subscribe: ", undo);
            if (undo.type == 'app.testeUndo') {
                console.log("Aqui deveríamos desfazer a ação");
            }
        });
    }

    switchTheme() {
        this.themeService.switchTheme();

        let currentTheme = this.themeService.getCurrentTheme();
        localStorage.setItem('theme', currentTheme);
    }

    switchLanguage(language: 'en' | 'pt-BR') {
        this.translate.use(language);
        localStorage.setItem('language', language);
        console.log("Trocando a língua para ", language)
    }

    undo() {
        this.messageService.clear();
        this.undoService.undo();
    }

}
