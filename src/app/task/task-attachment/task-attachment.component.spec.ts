import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskAttachmentComponent } from './task-attachment.component';

describe('TaskAttachmentComponent', () => {
  let component: TaskAttachmentComponent;
  let fixture: ComponentFixture<TaskAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAttachmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
