import { Pipe, PipeTransform } from '@angular/core';
import linkifyHtml from "linkify-html";
import sanitizeHtml from 'sanitize-html';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface LinkifyOptions {
  defaultProtocol?: 'http' | 'https';
  nl2br?: boolean
}


@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined, args: LinkifyOptions | undefined = undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const options = {
      rel: 'external',
      defaultProtocol: 'http',
      target: '_blank',
      truncate: 60,
      className: 'linkify-link',
      ...args,
    };

    const sanitized = sanitizeHtml(value, {
      disallowedTagsMode: "escape",
      allowedTags: ['']
    });

    let linkified = linkifyHtml(
      sanitized as string,
      options
    );

    if (options.nl2br) {
        linkified = linkified.replaceAll("\n", "<br />");
    }

    return this.sanitizer.bypassSecurityTrustHtml(linkified);
  }
}
