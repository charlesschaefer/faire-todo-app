import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { inboxResolver } from './inbox.resolver';

describe('inboxResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => inboxResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
