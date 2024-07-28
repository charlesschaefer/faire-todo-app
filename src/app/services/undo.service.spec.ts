import { TestBed } from '@angular/core/testing';

import { UndoService } from './undo.service';

describe('UndoService', () => {
  let service: UndoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UndoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
