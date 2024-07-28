import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TieredMenuModule } from 'primeng/tieredmenu';
import {TranslateService} from '@ngx-translate/core';


import { ThemeService } from './services/theme.service';
import { routes } from './app.routes';
import { firstValueFrom } from 'rxjs';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule, 
        RouterOutlet,
        ToolbarModule,
        ButtonModule,
        TieredMenuModule,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    showRightPanel: boolean = !false;

    menuItems!: MenuItem[];

    constructor(
        private themeService: ThemeService,
        private translate: TranslateService,
    ) {
        translate.setDefaultLang('en');
        //translate.use('en');

        this.setMenuItems();

        let userLanguage = localStorage.getItem('language');
        if (!userLanguage) {
            userLanguage = 'en';
        }
        console.log("Definindo a língua em ", userLanguage);
        this.translate.use(userLanguage);
    }

    async setMenuItems() {
        this.menuItems = [
            { label: await firstValueFrom(this.translate.get("Inbox")), icon: 'pi pi-inbox', routerLink: '/inbox' } as MenuItem,
            { label: await firstValueFrom(this.translate.get(`Today`)), icon: 'pi pi-calendar', routerLink: '/today' } as MenuItem,
            { label: await firstValueFrom(this.translate.get(`Upcoming`)), icon: 'pi pi-clock', routerLink: '/upcoming' } as MenuItem,
            { label: await firstValueFrom(this.translate.get(`Projects`)), icon: 'pi pi-clipboard', routerLink: '/project' } as MenuItem,
            { label: await firstValueFrom(this.translate.get(`Search`)), icon: 'pi pi-search', routerLink: '/search' } as MenuItem,
            {
                separator: true
            },
            { label: await firstValueFrom(this.translate.get("Mudar tema")), command: () => this.switchTheme(), icon: "pi pi-moon" } as MenuItem,
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
            } as MenuItem,
        ];
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

}
