import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { ThemeService } from './services/theme.service';

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
        { label: $localize `Inbox`, icon: 'pi pi-inbox' },
        { label: $localize `Today`, icon: 'pi pi-calendar' },
        { label: $localize `Upcoming`, icon: 'pi pi-clock' },
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

        /* const sawGuidedTour = this.cookieService.get('sawGuidedTour');
        if (!sawGuidedTour) {
            this.initializeGuidedTour();
        } */
    }

}
