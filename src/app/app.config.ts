import { ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

import { routes } from "./app.routes";
import { environment } from '../environments/environment';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { AppRxDb } from "./app.rxdb";


export const appConfig: ApplicationConfig = {
    providers: [
        {
            provide: 'AppRxdb',
            // useFactory: (deps: any) => {
            //     console.log("AppRxdb deps: ", deps)
            //     return AppRxDb.getInstance();
            // },
            useClass: AppRxDb
        },
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        // importProvidersFrom(NgxIndexedDBModule.forRoot(dbConfig)),
        importProvidersFrom(TranslocoModule), 
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
        }),
        {
            provide: 'SUPABASE_URL',
            useValue: environment.supabaseUrl
        },
        {
            provide: 'SUPABASE_KEY',
            useValue: environment.supabaseKey
        },
        MessageService
    ],
};
