import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { ThemeService } from './services/theme.service';
import { routes } from './app.routes';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule, 
        RouterOutlet,
        ToolbarModule,
        ButtonModule,
        MenuModule,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    showRightPanel: boolean = !false;

    menuItems = [
        { label: $localize `Add task`, icon: 'pi pi-plus-circle' },
        { label: $localize `Search`, icon: 'pi pi-search' },
        { label: $localize `Inbox`, icon: 'pi pi-inbox', routerLink: '/inbox' },
        { label: $localize `Today`, icon: 'pi pi-calendar', routerLink: '/today' },
        { label: $localize `Upcoming`, icon: 'pi pi-clock', routerLink: '/upcoming' },
        { label: $localize `Projects`, icon: 'pi pi-clipboard', routerLink: '/project' },
        {
            separator: true
        },
        { label: "Mudar tema", command: () => this.switchTheme(), icon: "pi pi-moon" },
    ];

    constructor(
        private themeService: ThemeService,
    ) {}
    
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

}
