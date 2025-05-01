import { Injectable } from '@angular/core';

type ShortcutHandler = (event: KeyboardEvent) => void;

export interface Shortcut {
    key: string;
    handler: ShortcutHandler;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
    private shortcuts?: Shortcut[] = [];

    constructor() {
        console.log('KeyboardShortcutService initialized');
    }

    /**
     * Register a shortcut key and its handler.
     * @param key The key string, e.g. "Shift+?"
     * @param handler The function to call when the shortcut is triggered.
     */
    setShortcut(shortcut: Shortcut) {
        this.shortcuts?.push(shortcut);
    }

    /**
     * Register a list of shortcut keys and their handlers.
     * @param shortcuts An array of shortcut objects.
     */
    setShortcuts(shortcuts: Shortcut[]) {
        shortcuts.forEach((shortcut) => this.setShortcut(shortcut));
    }

    /**
     * Remove a shortcut by key.
     */
    removeShortcut(key: string) {
        this.shortcuts = this.shortcuts?.filter(
            (shortcut) => shortcut.key.toLowerCase() !== key.toLowerCase()
        );
    }

    getShortcuts(): Shortcut[] {
        return this.shortcuts || [];
    }

    /**
     * Should be bound to the keydown event.
     */
    handleKeydown(event: KeyboardEvent) {
        if (this.isInputFocused()) {
            // Ignore keydown events when an input is focused
            return;
        }
        // Compose key string, e.g. "Shift+?"
        let key = '';
        if (event.ctrlKey) key += 'Ctrl+';
        if (event.altKey) key += 'Alt+';
        if (event.metaKey) key += 'Meta+';
        if (event.shiftKey) key += 'Shift+';
        key += event.key;

        const shortcut = this.shortcuts?.find(
            (s) => s.key.toLowerCase() === key.toLowerCase()
        );

        if (shortcut && !event.repeat && !this.isInputFocused()) {
            event.preventDefault();
            shortcut.handler(event);
        }
    }

    private isInputFocused(): boolean {
        const active = document.activeElement;
        if (!active) return false;
        const tag = active.tagName.toLowerCase();
        return (
            tag === 'input' ||
            tag === 'textarea' ||
            (active as HTMLElement).isContentEditable
        );
    }
}
