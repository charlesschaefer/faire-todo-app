import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogService } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { Subject } from 'rxjs';
import { NgxSwipeMenuComponent } from 'ngx-swipe-menu';

import { NgxCdkDnDScrollFixerDirective } from '../../directives/ngx-cdk-dn-dscroll-fixer.directive';
import { TaskDto } from '../../dto/task-dto';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';
import { LinkifyPipe } from '../../pipes/linkify.pipe';
import { UndoService } from '../../services/undo.service';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskService } from '../task.service';
// eslint-disable-next-line import/no-cycle
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskAbstractComponent } from '../task/task.abstract.component';


@Component({
    selector: 'app-subtask',
    standalone: true,
    imports: [
        RadioButtonModule,
        FormsModule,
        ButtonModule,
        MenuModule,
        ConfirmDialogModule,
        CdkDrag,
        CdkDragPlaceholder,
        CheckboxModule,
        ToastModule,
        ContextMenuModule,
        DateShortenerPipe,
        TranslocoModule,
        LinkifyPipe,
        NgxCdkDnDScrollFixerDirective,
        NgxSwipeMenuComponent,
    ],
    providers: [
        MessageService,
        DialogService,
        ConfirmationService,
    ],
    templateUrl: '../task/task.component.html',
    styleUrl: 'subtask.component.scss'
})
export class SubtaskComponent extends TaskAbstractComponent {
    
    constructor(
        protected override dialogService: DialogService,
        protected override messageService: MessageService,
        protected override taskService: TaskService,
        protected override confirmationService: ConfirmationService,
        protected override translate: TranslocoService,
        protected override undoService: UndoService,
    ) {
        super(
            dialogService,
            messageService,
            taskService,
            confirmationService,
            translate,
            undoService,
        );
    }

    async showTaskEditDialog(task: TaskDto): Promise<void> {
        this.dialogRef = this.dialogService.open(TaskEditComponent, {
            header: this.translate.translate(`Edit Task`),
            width: '80%',
            height: '80%',
            breakpoints: {
                '500px': '90%',
                '400px': '100%'
            },
            data: {
                task: task,
                saveSubject$: new Subject(),
                onSaveEditTask$: this.onSaveEditTask$,
            },
            templates: {
                footer: TaskEditFooterComponent
            },
        });

        this.dialogRef.onClose.subscribe((data: TaskDto) => {
            if (data != undefined && data.title != undefined) {
                this._changedTask = data as TaskDto;
                this.checkTaskIsDue();
            }
        });
    }

}
