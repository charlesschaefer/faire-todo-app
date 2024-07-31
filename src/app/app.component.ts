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
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
  } from '@tauri-apps/plugin-notification';


import { ThemeService } from './services/theme.service';
import { routes } from './app.routes';
import { UndoService, UndoItem } from './services/undo.service';
import { ProjectService } from './services/project.service';
import { ProjectDto } from './dto/project-dto';
import { TaskDto } from './dto/task-dto';

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


        let userLanguage = localStorage.getItem('language');
        if (!userLanguage) {
            userLanguage = 'en';
        }
        console.log("Definindo a língua em ", userLanguage);
        this.translate.use(userLanguage);
    }

    async setMenuItems(additionalItems: MenuItem[]) {
        let menuItems: MenuItem[] = [{
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
        for (let item of additionalItems) {
            menuItems.push(item);
        }

        this.menuItems = menuItems;

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

    async getProjectMenuItems(): Promise<MenuItem[]> {
        let projects = await firstValueFrom(this.projectService.list())
        console.log("Projetos: ", projects);
        if (!projects.length) return [];
        let projectItems: MenuItem[] = [];
        for (let project of projects) {
            projectItems.push({
                label: project.name, 
                icon: 'pi pi-hashtag',
                routerLink: `/project/${project.id}/tasks`
            });
        }
        let projectMenuItems = {
            label: await firstValueFrom(this.translate.get("Projects")),
            items: projectItems
        };
        console.log("MenuItems", this.menuItems, "ProjectMenuItems: ", projectMenuItems);
        return [
            {separator: true},
            projectMenuItems,
        ];
    }
    
    async ngOnInit() {
        //invoke("set_frontend_complete");

        let projectItems = await this.getProjectMenuItems();
        await this.setMenuItems(projectItems);
        

        console.log("Menu Items now: ", this.menuItems);

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

        // starts the notification worker
        if (typeof Worker !== 'undefined') {
            // Create a new
            const worker = new Worker(new URL('./app.worker', import.meta.url));
            worker.onmessage = ({ data }) => {
                this.notifyDueingTask(data.task);
            };
            worker.postMessage('hello');
          } else {
              // Web Workers are not supported in this environment.
              // You should add a fallback so that your program still executes correctly.
          }
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

    async notifyDueingTask(task: TaskDto) {
        console.log("Received the task", task);
        // Do you have permission to send a notification?
        let permissionGranted = await isPermissionGranted();
        console.log("Permission granted?", permissionGranted);
        // If not we need to request it
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        console.log("Permission acquired?", permissionGranted);

        // Once permission has been granted we can send the notification
        if (permissionGranted) {
            sendNotification({
                title: 'Task due',
                body: `The task "${task.title}" is dueing now.`
            });
        }
    }

}
