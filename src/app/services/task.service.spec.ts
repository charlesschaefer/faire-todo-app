import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { TaskAddDto, TaskDto } from '../dto/task-dto';
import { DbService } from './db.service';

describe('TaskService', () => {
  let service: TaskService<TaskAddDto>;
  let dbServiceSpy: jasmine.SpyObj<DbService>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dbServiceSpy = jasmine.createSpyObj(DbService, ['task']);
    //service = TestBed.inject(TaskService);
    service = new TaskService<TaskAddDto>(dbServiceSpy);
    
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
