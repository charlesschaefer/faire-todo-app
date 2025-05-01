import { Pipe, PipeTransform } from '@angular/core';
import sanitizeHtml from 'sanitize-html';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'subtitle',
  standalone: true
})
export class SubtitlePipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string, ...args: string[]): unknown {
    if (!value) {
      return '';
    }

    const sanitized = sanitizeHtml(value, {
      disallowedTagsMode: "escape",
      allowedTags: ['']
    });

    let small;
    if (args.indexOf('small') !== -1) {
      small = 'text-sm';
    }

    const output = `<span class="page-subtitle ${small}">${sanitized}</span>`;


    return this.sanitizer.bypassSecurityTrustHtml(output);
  }

}
