import { inject } from '@angular/core';

import { DateShortenerPipe } from './date-shortener.pipe';

describe('DateShortenerPipe', () => {
  it('create an instance', () => {
    const pipe = inject(DateShortenerPipe);
    expect(pipe).toBeTruthy();
  });
});
