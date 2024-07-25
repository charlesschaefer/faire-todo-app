import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-task-add',
    standalone: true,
    imports: [
        OverlayPanelModule,
        CardModule,
        CalendarModule,
        InputTextareaModule,
        DividerModule,
    ],
    templateUrl: './task-add.component.html',
    styleUrl: './task-add.component.scss'
})
export class TaskAddComponent implements OnInit {
    @Input() showOverlay$!: Subject<Event>;
    @Output() showOverlay$Change = new EventEmitter<Subject<Event>>();
    @ViewChild('taskAddOp') taskAddOp!: OverlayPanel;

    ngOnInit(): void {
        this.showOverlay$.subscribe(event => {
            if (event) {
                this.taskAddOp.show(event);
            }
        })
    }

    onClose(event: Event) {
        this.showOverlay$.next(event);
        this.showOverlay$Change.emit(this.showOverlay$);
    }
}
