import { SubtitlePipe } from './subtitle.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('SubtitlePipe', () => {
  let domSanitizer: DomSanitizer;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    domSanitizer = TestBed.inject(DomSanitizer);
  });

  it('create an instance', () => {
    const pipe = new SubtitlePipe(domSanitizer);
    expect(pipe).toBeTruthy();
  });
});
