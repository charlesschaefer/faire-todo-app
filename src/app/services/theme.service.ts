import { Injectable } from '@angular/core';

const DARK_MODE_SELECTOR = 'dark-mode';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    currentTheme = 'light';
    
    switchTheme(theme?: string) {
        const themeLink = window.document.getElementById('app-theme') as HTMLLinkElement;
        console.log(theme, themeLink)
        if (theme) {
            if (theme == 'dark') {
                themeLink.classList.add(DARK_MODE_SELECTOR);
            } else {
                themeLink.classList.remove(DARK_MODE_SELECTOR)
            }
            this.currentTheme = theme;
            return;
        }
        
        if (themeLink) {
            if (themeLink.className.match(DARK_MODE_SELECTOR)) {
                themeLink.classList.remove(DARK_MODE_SELECTOR)
                this.currentTheme = 'light';
            } else {
                themeLink.classList.add(DARK_MODE_SELECTOR);
                this.currentTheme = 'dark';
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}
