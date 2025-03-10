import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { check, Update } from '@tauri-apps/plugin-updater';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';

// eslint-disable-next-line import/extensions
import packageJson from '../../../package.json';
import { isMobile } from '../../utils/functions';


@Component({
    selector: 'app-version',
    standalone: true,
    imports: [
        ButtonModule,
        RouterLink,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService, MessageService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './version.component.html',
    styles: `
        a, button { text-decoration: none; font-size: 0.8em} 
        * {text-align: center;}
    `
})
export class VersionComponent implements OnInit {
    version = '';

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private translate: TranslocoService,
    ) {
        this.version = packageJson.version
    }

    ngOnInit(): void {
        if (isMobile()) {
            return;
        }

        this.checkNewVersions().then((update) => {
            if (!update)
                return;

            this.confirmationService.confirm({
                closable: true,
                closeOnEscape: true,
                header: this.translate.translate('New version available'),
                message: this.translate.translate('Do you want to download and install the new version {{version}}?', { version: update?.version }),
                accept: () => {
                    this.downloadAndInstall(update);
                }
            })
        });
    }

    async checkNewVersions(): Promise<Update | void> {
        const update = await check();
        if (!update) {
            console.warn("Could not check for updates");
            return;
        }
        return update;
    }

    async downloadAndInstall(update: Update) {
        console.log(`Found update ${update.version} from ${update.date} with notes ${update.body}`);
        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((event) => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength as number;
                    console.log(`started downloading ${event.data.contentLength} bytes`);
                    break;

                case 'Progress':
                    downloaded += event.data.chunkLength;
                    console.log(`downloaded ${downloaded} from ${contentLength}`);
                    break;

                case 'Finished':
                    console.log('finished downloading');
                    break;
            }
        });

        console.log('Update installed');
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Update installed! Restart the app to take effect.'
        });
    }

}
