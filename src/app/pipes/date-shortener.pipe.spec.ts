import { DateShortenerPipe } from './date-shortener.pipe';
import { inject } from '@angular/core';

describe('DateShortenerPipe', () => {
  it('create an instance', () => {
    const pipe = inject(DateShortenerPipe);
    expect(pipe).toBeTruthy();
  });
});
