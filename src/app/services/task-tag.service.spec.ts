import { TestBed } from '@angular/core/testing';

import { TaskTagService } from './task-tag.service';

describe('TaskTagService', () => {
  let service: TaskTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskTagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
