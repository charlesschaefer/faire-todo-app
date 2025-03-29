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
import { TreeModule } from 'primeng/tree';
import { Subject } from 'rxjs';

import { NgxCdkDnDScrollFixerDirective } from '../../directives/ngx-cdk-dn-dscroll-fixer.directive';
import { TaskDto } from '../../dto/task-dto';
import { DateShortenerPipe } from '../../pipes/date-shortener.pipe';
import { LinkifyPipe } from '../../pipes/linkify.pipe';
import { DataUpdatedService } from '../../services/data-updated.service';
import { UndoService } from '../../services/undo.service';
import { TaskEditFooterComponent } from '../task-edit/task-edit-footer/task-edit-footer.component';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskService } from '../task.service';
import { TaskAbstractComponent } from './task.abstract.component';
import { CommonModule, NgTemplateOutlet } from '@angular/common';


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
        CommonModule,
        NgTemplateOutlet,
        CommonModule,
        NgTemplateOutlet
    ],
    providers: [
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
        protected dataUpdatedService: DataUpdatedService,
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
            focusOnShow: false,
            data: {
                task: task,
                saveSubject$: new Subject(),
                onSaveEditTask$: this.onSaveEditTask$,
            },
            templates: {
                footer: TaskEditFooterComponent
            },
            closable: true,
            dismissableMask: true,
            modal: true,
            //appendTo: "body"
            style: {
                'justify-content': 'space-between'
            },
            contentStyle: {
                'flex-grow': '1'
            }
        });

        this.dialogRef.onClose.subscribe((data: TaskDto) => {
            if (data != undefined && data.title != undefined) {
                // this.dataUpdatedService.next([{
                //     table: 'task',
                //     key: 'uuid',
                //     type: DatabaseChangeType.Update,
                //     obj: data,
                //     mods: data,
                //     oldObj: data
                // }]);
                this._changedTask = data as TaskDto;
                this.checkTaskIsDue();
            }
        });
    }

    
}
