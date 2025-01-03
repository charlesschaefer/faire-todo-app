import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Component } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogService } from 'primeng/dynamicdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';

import { TaskDto } from '../../dto/task-dto';
import { TaskService } from '../task.service';
import { UndoService } from '../../services/undo.service';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';
import { Subject } from 'rxjs';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskAbstractComponent } from '../task/task.abstract.component';
import { LinkifyPipe } from '../../pipes/linkify.pipe';
import { NgxCdkDnDScrollFixerDirective } from '../../directives/ngx-cdk-dn-dscroll-fixer.directive';


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
        NgxCdkDnDScrollFixerDirective
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
