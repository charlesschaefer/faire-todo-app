import { ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader} from '@ngx-translate/core';
import { TranslocoModule } from '@jsverse/transloco';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';


import { routes } from "./app.routes";
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        importProvidersFrom(TranslocoModule), 
        // provideHttpClient(), 
        provideTransloco({
            config: { 
                availableLangs: ['en', 'pt-BR'],
                defaultLang: 'en',
                // Remove this option if your application doesn't support changing language in runtime.
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
                missingHandler: {
                    allowEmpty: true,
                    logMissingKey: true
                }
            },
            loader: TranslocoHttpLoader
        })
    ],
};
