import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { TaskDto } from '../dto/task-dto';

describe('TaskService', () => {
  let service: TaskService<TaskDto>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
