import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTasksComponent } from './project-tasks.component';

describe('ProjectTasksComponent', () => {
  let component: ProjectTasksComponent;
  let fixture: ComponentFixture<ProjectTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
