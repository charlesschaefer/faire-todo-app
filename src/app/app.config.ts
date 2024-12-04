import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxIndexedDBModule } from "ngx-indexed-db";
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';


import { routes } from "./app.routes";
import { environment } from '../environments/environment';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        // importProvidersFrom(NgxIndexedDBModule.forRoot(dbConfig)),
        importProvidersFrom(TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            defaultLanguage: 'en'
        })),
        {
            provide: 'SUPABASE_URL',
            useValue: environment.supabaseUrl
        },
        {
            provide: 'SUPABASE_KEY',
            useValue: environment.supabaseKey
        }
    ],
};
