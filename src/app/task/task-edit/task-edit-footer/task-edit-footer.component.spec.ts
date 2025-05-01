import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskEditFooterComponent } from './task-edit-footer.component';

describe('TaskEditFooterComponent', () => {
  let component: TaskEditFooterComponent;
  let fixture: ComponentFixture<TaskEditFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskEditFooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskEditFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
