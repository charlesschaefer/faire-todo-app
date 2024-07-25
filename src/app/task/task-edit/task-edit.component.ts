import { Component } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [
    CardModule,
    CalendarModule,
    InputTextareaModule,
    DividerModule,
  ],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent {

}
