import { ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { provideRouter, withDebugTracing, withRouterConfig } from "@angular/router";
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
import { providePrimeNG } from "primeng/config";
import { AppTheme } from "./app.theme";
import { DEBUG } from "./app.debug";

const debugTracing = [];
void (DEBUG ? debugTracing.push(withDebugTracing()) : null);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, 
            withRouterConfig({
                onSameUrlNavigation: 'reload',
                urlUpdateStrategy: 'eager'
            }),
            ...debugTracing,
        ),
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
                availableLangs: ['en', 'pt-br'],
                defaultLang: 'en',
                fallbackLang: 'en',
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
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: AppTheme,
                options: {
                    darkModeSelector: '.dark-mode'
                }
            }
        })
    ],
};

