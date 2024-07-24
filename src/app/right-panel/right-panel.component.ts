import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';

@Component({
    selector: 'app-right-panel',
    standalone: true,
    imports: [
        SidebarModule,
    ],
    templateUrl: './right-panel.component.html',
    styleUrl: './right-panel.component.scss'
})
export class RightPanelComponent {
    @Input() visible = false;
    @Output() changeVisibility = new EventEmitter<boolean>();

    onChangeVisibility() {
        this.changeVisibility.emit(!this.visible);
    }
}
