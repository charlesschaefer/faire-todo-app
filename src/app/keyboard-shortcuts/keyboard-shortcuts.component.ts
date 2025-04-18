import { Component, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { KeyboardShortcutService, Shortcut } from '../services/keyboard-shortcut.service';

@Component({
    selector: 'app-keyboard-shortcuts',
    standalone: true,
    imports: [DialogModule],
    template: `
      <p-dialog [(visible)]="showShortcuts" [modal]="true" [closable]="true" [style]="{width: '30rem'}" (onHide)="closeShortcuts()" header="Keyboard Shortcuts">
        <ul>
            @for (shortcut of shortcuts; track shortcut.key ) {
                <li><b>{{ shortcut.key }}</b>: {{ shortcut.description }}</li>
            }
            <!-- Add more shortcuts here -->
        </ul>
    </p-dialog>
    `,
    styles: [`
      h2 { margin-bottom: 1rem; }
      ul { list-style: none; padding: 0; }
      li { margin-bottom: 0.5rem; }
    `]
})
export class KeyboardShortcutsComponent {
    showShortcuts = model<boolean>(false);

    shortcuts?: Shortcut[];

    constructor(
        private keyboardShortcutService: KeyboardShortcutService,
    ) {
        this.shortcuts = this.keyboardShortcutService.getShortcuts();
    }

    closeShortcuts() {
        console.log('Closing shortcuts dialog');
        this.showShortcuts.update(() => false);
    }
}
