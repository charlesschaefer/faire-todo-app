import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@jsverse/transloco';
import { firstValueFrom, Subject } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TreeModule } from 'primeng/tree';

import { TaskDto } from '../../dto/task-dto';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskService } from '../../services/task.service';
import { UndoService } from '../../services/undo.service';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';
import { TaskAbstractComponent } from './task.abstract.component';
import { LinkifyPipe } from '../../pipes/linkify.pipe';
import { NgxCdkDnDScrollFixerDirective } from '../../directives/ngx-cdk-dn-dscroll-fixer.directive';


@Component({
    selector: 'app-task',
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
        TreeModule,
        DateShortenerPipe,
        TranslocoModule,
        LinkifyPipe,
        NgxCdkDnDScrollFixerDirective,
    ],
    providers: [
        MessageService,
        DialogService,
        ConfirmationService
    ],
    templateUrl: './task.component.html',
    styleUrl: './task.component.scss'
})
export class TaskComponent extends TaskAbstractComponent {
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
            header: await firstValueFrom(this.translate.selectTranslate(`Edit Task`)),
            width: '80%',
            height: '80%',
            breakpoints: {
                '500px': '90%',
                '400px': '100%'
            },
            focusOnShow: false,
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
                this.task = data as TaskDto;
                this.checkTaskIsDue();
            }
        });
    }
}
