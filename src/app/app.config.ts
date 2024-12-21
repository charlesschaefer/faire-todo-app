import { ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { provideRouter, RouterModule, withDebugTracing, withRouterConfig, withViewTransitions } from "@angular/router";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

import { routes } from "./app.routes";
import { environment } from '../environments/environment';
import { SyncService } from './services/sync.service';
import { AppDb } from "./app.db";
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';

const DEBUG = isDevMode();

const debugTracing = [];
DEBUG ? debugTracing.push(withDebugTracing()) : null;

export const appConfig: ApplicationConfig = {
    providers: [
        // importProvidersFrom(RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })),
        provideRouter(routes, 
            ...debugTracing,
            withRouterConfig({
                onSameUrlNavigation: 'reload',
                urlUpdateStrategy: 'eager'
            })
        ),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        {
            provide: 'SUPABASE_URL',
            useValue: environment.supabaseUrl
        },
        {
            provide: 'SUPABASE_KEY',
            useValue: environment.supabaseKey
        },
        {
            provide: 'AppDb',
            useClass: AppDb
        },
        {
            provide: 'DEBUG',
            useValue: DEBUG
        },
        MessageService,
        SyncService,
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
        }),
    ],
};

