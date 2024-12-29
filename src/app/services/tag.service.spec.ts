import { TestBed } from '@angular/core/testing';

import { TagService } from './tag.service';
import { TagDto } from '../dto/tag-dto';

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
