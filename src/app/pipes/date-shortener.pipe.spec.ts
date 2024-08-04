import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DateShortenerPipe } from './date-shortener.pipe';
import { Inject, Injector, inject } from '@angular/core';

describe('DateShortenerPipe', () => {
  it('create an instance', () => {
    const pipe = inject(DateShortenerPipe);
    expect(pipe).toBeTruthy();
  });
});
