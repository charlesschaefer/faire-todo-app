import { ChangeDetectionStrategy, Component } from '@angular/core';
import packageJson from '../../../package.json';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-version',
    standalone: true,
    imports: [ButtonModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './version.component.html',
    styles: `
        a, button { text-decoration: none; font-size: 0.8em} 
        * {text-align: center;}
    `
})
export class VersionComponent {
    version = '';

    constructor() {
        this.version = packageJson.version
    }

}
