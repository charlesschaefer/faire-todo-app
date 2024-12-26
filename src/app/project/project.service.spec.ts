import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { ProjectDto } from '../dto/project-dto';

describe('ProjectService', () => {
  let service: ProjectService<ProjectDto>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
